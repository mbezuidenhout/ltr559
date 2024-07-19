const LTR559 = require('@bezuidenhout/ltr559-sensor');

// The LTR559 constructor options are optional.
// 
const options = {
  i2cBusNo   : 1, // defaults to 1
  i2cAddress : LTR559.LTR559_DEFAULT_I2C_ADDRESS() // defaults to 0x23
};

const ltr559 = new LTR559(options);

// Read LTR559 sensor data, repeat
//
const readSensorData = () => {
  ltr559.readSensorData()
    .then((data) => {
      console.log(`data = ${JSON.stringify(data, null, 2)}`);
      setTimeout(readSensorData, 2000);
    })
    .catch((err) => {
      console.log(`LTR559 read error: ${err}`);
      setTimeout(readSensorData, 2000);
    });
};

// Initialize the LTR559 sensor
//
ltr559.init()
  .then(() => {
    console.log('LTR559 initialization succeeded');
    readSensorData();
  })
  .catch((err) => console.error(`LTR559 initialization failed: ${err} `));
