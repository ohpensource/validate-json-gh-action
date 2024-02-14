> [!CAUTION]
> Project archived and migrated to Ohpen organization.

# validate-json-gh-action
Validate json files against json schema

### github-action

This action validates json files against json schema. The (required) inputs are:

- _schema-directory_: Directory containing schemas.
- _data-directory_: Directory containing data (JSON files).
- _schema-to-data-mapping_: JSON array containing mapping between data to validate and schema.

Example of schema mapping json array:
```json
[
		{
			"data": "**/closecl-grossnet*.json",
			"schemaPath": "grossnet.json"
		},
		{
			"data": "**/closecl-maxloan*.json",
			"schemaPath": "maxloan.json"
		},
		{
			"data": "**/closecl-ppm*.json",
			"schemaPath": "ppm.json"
		}
	]
```

Action also accepts patterns to identify data (JSON) files like ***/my-files*matching-this-pattern.json
If the validation fails, action will throw error and workflow will also fail

### usage

```yaml
name: Validate

on:
  workflow_call:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout sources
        uses: actions/checkout@v3
      - uses: ohpensource/validate-json-gh-action@0.0.0.1
        name: Validate configuration
        with:
          schema-directory: ${{ github.workspace }}/_schemas
          data-directory: ${{ github.workspace }}/configuration
          schema-to-data-mapping: $(jq -r '.mappings' schema-to-data-mapping.json)
```

### License Summary

This code is made available under the MIT license. Details [here](LICENSE).
