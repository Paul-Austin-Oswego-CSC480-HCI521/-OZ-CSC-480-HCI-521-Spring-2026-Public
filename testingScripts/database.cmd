cd ..
docker rm -f csc480-mongodb-container
   cd backend && docker build -t csc480-mongodb -f assets/Dockerfile .
   docker run --name csc480-mongodb-container -p 27017:27017 -d csc480-mongodb
   timeout /t 5
   docker cp csc480-mongodb-container:/home/mongodb/certs/truststore.p12 ./finish/src/main/liberty/config/resources/security
   docker start csc480-mongodb-container