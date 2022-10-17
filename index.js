const Ajv = require('ajv')
const glob = require('glob')
const fs = require('fs')

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
		return false
	}
	return true
}

const validateMapping = async (schemas, mapping) => {
	return new Promise(resolve => {
		glob(`${process.env.DATA_DIRECTORY}/${mapping.data}`, async (err, files) => {
			if (err) {
				console.log(err)
			}

			let result = true
			for (const file of files) {
				result = await validateData(schemas, file, mapping.schemaPath) && result
			}
			resolve(result)
		})
	})
}

(async () => {

	const mappings = JSON.parse(process.env.SCHEMA_TO_DATA_MAPPING)

	const schemas = new Map(await Promise.all(mappings.map(async mapping => await readSchema(mapping.schemaPath))))

	let result = true
	for (const mapping of mappings) {
		result = await validateMapping(schemas, mapping) && result
	}

	if (!result) {
		throw new Error('Validation failed')
	} else {
		console.log('Success - all files are valid')
	}
})()

