# airtable-loader

This is a simple loader that will load data from an [Airtable](https://airtable.com/) table at build time using the settings provided in a `.airtable` file.

## Install

```yarn add -D airtable-loader```

or

```npm install --save-dev airtable-loader```

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
            "airtableName": "Name",
            "mapToName": "name"
        },
        {
            "airtableName": "Phone",
            "mapToName": "phone"
        }
    ]
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