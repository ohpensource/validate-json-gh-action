const Ajv = require('ajv')
const glob = require('glob')
const fs = require('fs')
const githubCore = require('@actions/core')

const ajv = new Ajv({
						allErrors: true
					})

const fsReadingOptions = {
	encoding: 'utf8'
}

const readSchema = async (path) => {
	const schemaBody = await fs.promises.readFile(`${process.env.SCHEMAS_DIRECTORY}/${path}`, fsReadingOptions)
	return [path, ajv.compile(JSON.parse(schemaBody))]
}

const validateData = async (schemas, dataPath, schemaPath) => {
	console.log(`Validating ${dataPath} with schema ${schemaPath}`)
	const data = await fs.promises.readFile(dataPath, fsReadingOptions)
	const validate = schemas.get(schemaPath)
	const valid = validate(JSON.parse(data))
	if (!valid) {
		console.log(`Validation errors in file ${dataPath} validated against schema ${schemaPath}: ${JSON.stringify(validate.errors)}`)
		return {
			result: false,
			errors: validate.errors
		}
	}
	return {
		result: true
	}
}

const validateMapping = async (schemas, mapping) => {
	return new Promise(resolve => {
		glob(`${process.env.DATA_DIRECTORY}/${mapping.data}`, async (err, files) => {
			if (err) {
				console.log(err)
			}

			let result = true
			const summaries = []
			for (const file of files) {
				const validation = await validateData(schemas, file, mapping.schemaPath)
				const summary = [
					{data: file.replace(`${process.env.DATA_DIRECTORY}/`, '')},
					{data: mapping.schemaPath}
				]
				if (!validation.result) {
					summary.push({data: '&#x274c;'})
					summary.push({data: `<pre lang="json"><code>${JSON.stringify(validation.errors, null, 2)}</code></pre>`})
				} else {
					summary.push({data: '&#x2714;'})
					summary.push({data: ''})
				}
				summaries.push(summary)
				result = validation.result && result
			}
			resolve({
						result: result,
						summaries: summaries
					})
		})
	})
}

(async () => {

	const mappings = JSON.parse(process.env.SCHEMA_TO_DATA_MAPPING)

	const schemas = new Map(await Promise.all(mappings.map(async mapping => await readSchema(mapping.schemaPath))))

	let result = true
	const summary = new githubCore.summary.constructor()
	let tableRows = []
	tableRows.push([{data: 'JSON File', header: true}, {data: 'Schema', header: true}, {data: 'Result', header: true}, {data: 'Errors', header: true}])
	for (const mapping of mappings) {
		const validationResult = await validateMapping(schemas, mapping)
		result = validationResult.result && result
		tableRows = tableRows.concat(validationResult.summaries)
	}
	summary.addTable(tableRows)
	await summary.write()

	if (!result) {
		throw new Error('Validation failed')
	} else {
		console.log('Success - all files are valid')
	}
})()

