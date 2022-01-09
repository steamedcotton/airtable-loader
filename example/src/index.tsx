import React from 'react';
import ReactDOM from 'react-dom';
import contacts from './contacts.airtable';

const Contacts = () => {
  return contacts.map((contact, i) => (
    <li key={i}>
      {contact.name}: {contact.phone}
    </li>
  ));
};

const App = () => {
  return (
    <div>
      <h1>Employee Contacts</h1>
      <ul>
        <Contacts />
      </ul>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
