# airtable-loader

This is a [webpack loader](https://webpack.js.org/loaders/) that will load data from an [Airtable](https://airtable.com/) table at build time using the settings provided in a `.airtable` file.  This then "packs" in the data into the Javascript that is produced.

## Install

```yarn add -D airtable-loader```

or

```npm install --save-dev airtable-loader```


## The .airtable File

The `.airtable` file contains the settings that will be used to generate the data to pack.  Referencing the file (i.e. `import myData from 'mydata.airtable';`) will create a Javascript object that contains the data from the Airtable table(s).


### Params

| Parameter Name         | Description                                                                    |
|------------------------|--------------------------------------------------------------------------------| 
| baseId                 | The Airtable base id (can be found in the API documentation for the Workspace) |
| tableName              | The name of the Airtable table                                                 |
| maxRecords             | The maximum number of records limit the Airtable API request                   |
| includeFilterFieldName | The mapToName field (a boolean value) to filter what the data is produced      |
| cacheTables            | Array of cacheTables that the loader will pre-fetch and cache in an effort to reduce the number of requests to Airtable |
| fields                 | Array of field mappings from Airtable to the Javascript object that's produced |

#### cacheTables

| Parameter Name         | Description                                                                    |
|------------------------|--------------------------------------------------------------------------------| 
| baseId                 | The Airtable base id (can be found in the API documentation for the Workspace) |
| tableName              | The name of the Airtable table                                                 |

#### fields

| Parameter Name         | Description                                                                    |
|------------------------|--------------------------------------------------------------------------------| 
| name                   | The exact name of the column in Aritable                                       |
| mapToName              | The name that will be used in the Javascript object that's produced            |
| resolve                | Used to resolve fields that have arrays of Airtable Ids that reference another table. |

#### resolve

| Parameter Name         | Description                                                                    |
|------------------------|--------------------------------------------------------------------------------|  
| baseId                 | The Airtable base id (can be found in the API documentation for the Workspace) |
| tableName              | The name of the Airtable table                                                 |
| maxRecords             | The maximum number of records limit the Airtable API request                   |
| includeFilterFieldName | The mapToName field (a boolean value) to filter what the data is produced      |
| fields                 | Array of field mappings from Airtable to the Javascript object that's produced |                               |


## Example webpack configuration  

```javascript
module.exports = {
    entry: './src/index.js',
    module: {
            rules: [
                {
                    test: /\.airtable/,
                    loader: 'airtable-loader',
                    options: {
                       apiKey: 'AIRTABLE_API_KEY' 
                    }
                }
            ]
    }
};
```

## Example .airtable file

The .airtable file should be in JSON format

**contacts.airtable**
```json
{
    "baseId": "<TABLE BASE ID>",
    "tableName": "Contacts",
    "maxRecords": 200,
    "fields": [
        {
            "name": "Name",
            "mapToName": "name"
        },
        {
            "name": "Phone",
            "mapToName": "phone"
        }
    ]
}
```

### Joining tables (resolving ids)

```json
{
    "baseId": "appmtqyIlK7hZ4kwL",
    "tableName": "Contacts",
    "maxRecords": 2,
    "fields": [
        {
            "name": "Name",
            "mapToName": "name"
        },
        {
            "name": "Phone",
            "mapToName": "phone"
        },
        {
            "name": "Skills",
            "mapToName": "skills",
            "resolve": {
                "tableName": "Contacts",
                "baseId": "appmtqyIlK7hZ4kwL",
                "fields": [
                    {
                        "name": "Skill Name",
                        "mapToName": "skillName"
                    }
                ]
            }
        }
    ]
}
```

### Caching complete tables

To save on requests to Airtable, you can have the loader retrieve the whole table and cache it.  The loader will then look in the cache before making a request to Airtable for the individual record.

```json
{
    "baseId": "appmtqyIlK7hZ4kwL",
    "tableName": "Contacts",
     "cacheTables": [
         {
             "tableName": "Contacts",
             "baseId": "appmtqyIlK7hZ4kwL"
         }
     ],
    "fields": ...
}
```

## Use in code

```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import contacts from './contacts.airtable';

const Contacts = () => {
    return contacts.map((contact, i) => <li key={i}>{contact.name}: {contact.phone}</li>);
};

const App = () => {
    return (
        <div>
            <h1>Contacts</h1>
            <ul>
                <Contacts />
            </ul>
        </div>
    );
};

ReactDOM.render(<App/>, document.getElementById('app'));

```

