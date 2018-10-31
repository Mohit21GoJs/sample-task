#### Assumptions ####

1.) Append only log file

2.) file.log is assumed to be updated line by line

3.) Whenever new line is added, all the clients who did not read this line while rendering the ui will be sent an event which contains data for this line and it will be disaplyed on ui.

### Pre-reqs ###

1.) Node 8+ and npm installed in system

#### To Run ####

1.) npm install

2.) npm start

### Improvements ###

1.) Error Handling for connection failure and for memory limitation.