# Ovum Forecaster API

## Local development

If your local setup matches the app specs as defined in the [package.json](./package.json) you can run the npm commands from the script section directly, otherwise just use the docker image which will start up with `npm run dev` as the default command.

### Docker image

To execute the docker image you need to set a couple of environment variables which are defined in an env file in the root directory of the project. All required variable identifiers are shipped in the [.env.dist](./.end.dist) file which you can use as an example.

```sh
# Start the container
$ docker-compose up

# Run the unit test suite
$ docker exec -it forecaster-api npm run test

# Execute bash inside the running container
$ docker exec -it forecaster-api bash
```
