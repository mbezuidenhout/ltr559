const LTR559 = require('./LTR559')

const options = {
  i2cBusNo   : 1, // defaults to 1
  i2cAddress : LTR559.LTR559_DEFAULT_I2C_ADDRESS() // defaults to 0x23
};

const ltr559 = new LTR559(options);

test('sensor init should succeed', async () => {
  expect.assertions(1);
  await expect(ltr559.init()).resolves.toBe(LTR559.PART_ID1_LTR559());
});

test('number of pulses more than 15 should fail', () => {
  expect.assertions(1);
  expect(ltr559.psNumberOfPulses(18)).rejects.toBe('Passed value must be between 1 and 15');
});
