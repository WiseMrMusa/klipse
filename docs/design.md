# System Design of the Application Architecture

## Services
- Upload Service
- Deployment Service 
- Request Handler Service 

- Webhook Service
- Web Server
- Database
- Queue System
- Monitoring System
- Authentication Service
- Authorization Service



## Components
[ ] Upload Service
- it takes the github repo url, clone it, and upload the files to the storage (s3)
- identify the process with an id

[ ] Deployment Service
- it takes the process id, and the files from the storage (s3)
- it builds the files and run it
- it returns the result of the deployment


[ ] Request Handler Service
- it takes the request from the user, and send it to the deployment service
- it returns the result of the deployment
- add cache for the result of the deployment


