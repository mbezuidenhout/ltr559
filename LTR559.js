/*
  LTR559.js

  A Node.js I2C module for the Lite-on LTR-559ALS-01 Light, and Proximity Sensor.

  See: https://optoelectronics.liteon.com/upload/download/ds86-2013-0003/ltr-559als-01_ds_v1.pdf

*/

'use strict';

class LTR559 {

  constructor(options) {
    const i2c = require('i2c-bus');

    this.i2cBusNo = (options && options.hasOwnProperty('i2cBusNo')) ? options.i2cBusNo : 1;    
    this.i2cBus = i2c.openSync(this.i2cBusNo);
    this.i2cAddress = (options && options.hasOwnProperty('i2cAddress')) ? options.i2cAddress : LTR559.LTR559_DEFAULT_I2C_ADDRESS();

    this.PART_ID         = 0x92;
    this.MANUFAC_ID      = 0x05;

    this.LED_PULSE_PERIOD_30  = 0x00;
    this.LED_PULSE_PERIOD_40  = 0x01 << 5;
    this.LED_PULSE_PERIOD_50  = 0x02 << 5;
    this.LED_PULSE_PERIOD_60  = 0x03 << 5; // Default
    this.LED_PULSE_PERIOD_70  = 0x04 << 5;
    this.LED_PULSE_PERIOD_80  = 0x05 << 5;
    this.LED_PULSE_PERIOD_90  = 0x06 << 5;
    this.LED_PULSE_PERIOD_100 = 0x07 << 5;

    this.DUTY_CYCLE_25  = 0x00;
    this.DUTY_CYCLE_50  = 0x01 << 3;
    this.DUTY_CYCLE_75  = 0x02 << 3;
    this.DUTY_CYCLE_100 = 0x03 << 3; // Default

    this.CURRENT_MA_5  = 0x00;
    this.CURRENT_MA_10 = 0x01;
    this.CURRENT_MA_20 = 0x02;
    this.CURRENT_MA_50 = 0x03;
    this.CURRENT_MA_100 = 0x04; // Default

    this.PS_MEAS_RATE_50    = 0x00;
    this.PS_MEAS_RATE_70    = 0x01;
    this.PS_MEAS_RATE_100   = 0x02; // Default
    this.PS_MEAS_RATE_200   = 0x03;
    this.PS_MEAS_RATE_500   = 0x04;
    this.PS_MEAS_RATE_1000  = 0x05;
    this.PS_MEAS_RATE_2000  = 0x06;
    this.PS_MEAS_RATE_10    = 0x08;

    this.ENABLE_ALS        = 0x01;
    this.ALS_DATA_GAIN_1X  = 0x00; // Default
    this.ALS_DATA_GAIN_2X  = 0x01;
    this.ALS_DATA_GAIN_4X  = 0x02;
    this.ALS_DATA_GAIN_8X  = 0x03;
    this.ALS_DATA_GAIN_48X = 0x06;
    this.ALS_DATA_GAIN_96X = 0x07;

    this.ALS_INTEGRAL_TIME_100 = 0x00; // Default
    this.ALS_INTEGRAL_TIME_50  = 0x04;
    this.ALS_INTEGRAL_TIME_200 = 0x08;
    this.ALS_INTEGRAL_TIME_400 = 0x0C;
    this.ALS_INTEGRAL_TIME_150 = 0x10;
    this.ALS_INTEGRAL_TIME_250 = 0x14;
    this.ALS_INTEGRAL_TIME_300 = 0x18;
    this.ALS_INTEGRAL_TIME_350 = 0x1C;

    this.ALS_MEAS_RATE_50   = 0x00;
    this.ALS_MEAS_RATE_100  = 0x01;
    this.ALS_MEAS_RATE_200  = 0x02;
    this.ALS_MEAS_RATE_500  = 0x03; // Default
    this.ALS_MEAS_RATE_1000 = 0x04;
    this.ALS_MEAS_RATE_2000 = 0x05;

    this.ALS_CH0_C = [17743, 42785, 5926, 0];
    this.ALS_CH1_C = [-11059, 19548, -1185, 0];
    this.ALS_GAIN = {0x00: 1, 0x01: 2, 0x03: 4, 0x04: 8, 0x06: 48, 0x07: 96};

    this.ENABLE_PS         = 0x03;
    this.ENABLE_SATURATION = 0x20;

    this.REGISTER_ALS_DATA    = 0x88;
    this.REGISTER_DATA_STATUS = 0x8C;
    this.REGISTER_PS_DATA     = 0x8D;

    this.REGISTER_PARTID    = 0x86;
    this.REGISTER_MANUFACID = 0x86;

    this.REGISTER_CONTROL_ALS   = 0x80;
    this.REGISTER_CONTROL_PS    = 0x81;
    this.REGISTER_PS_LED        = 0x82;
    this.REGISTER_PS_N_PULSES   = 0x83;
    this.REGISTER_PS_MEAS_RATE  = 0x84;
    this.REGISTER_ALS_MEAS_RATE = 0x85;

    this.REGISTER_INTERRUPT     = 0x8F;
  }

  init() {
    return new Promise((resolve, reject) => {
      this.i2cBus.writeByte(this.i2cAddress, this.REGISTER_PARTID, 0, (err) => {
        if(err) {
          return reject(err);
        }
        this.i2cBus.readByte(this.i2cAddress, this.REGISTER_PARTID, (err, partId) => {
          if(err) {
            return reject(err);
          }

          else if(partId !== LTR559.PART_ID1_LTR559()) {
            return reject(`Unexpected LTR559 part and revision ID: 0x${partId.toString(16)}`);
          }

          else {
            console.log(`Found LTR559 part and revision ID 0x${partId.toString(16)} on bus i2c-${this.i2cBusNo}, address 0x${this.i2cAddress.toString(16)}`);
            this.loadDefaults((err) => {
              return err ? reject(err) : resolve(partId);
            });
          }
        });
      });
    });
  }

  // reset()
  //
  // Perform a power-on reset procedure. You will need to call init() following a reset()
  //
  reset() {
    return new Promise((resolve, reject) => {
      const POWER_ON_RESET_CMD = 0x02;
      this.i2cBus.writeByte(this.i2cAddress, this.REGISTER_CONTROL_ALS, POWER_ON_RESET_CMD, (err) => {
        if(err) {
          return reject(err);
        }
        let retryCount = 0;
        const maxRetries = 3;
        const checkReset = () => {
          this.i2cBus.readByte(this.i2cAddress, this.REGISTER_CONTROL_ALS, (err, byte) => {
            if(err) {
              return reject(err);
            }
            if(byte === 0) {
              resolve();
            } else {
              retryCount++;
              if(retryCount >= maxRetries) {
                reject(new Error('Failed to reset LTR559'));
              } else {
                setTimeout(checkReset, 20);
              }
            }
          })
        }
        checkReset();
      });
    });
  }

  readSensorData() {
    return new Promise((resolve, reject) => {

      // Grab Lux, Proximity and data status in a single read
      //
      this.i2cBus.readI2cBlock(this.i2cAddress, this.REGISTER_ALS_DATA, 7, Buffer.alloc(8), (err, bytesRead, buffer) => {
        if(err) {
          return reject(err);
        }

        let als_data_invalid = Boolean(buffer[4] & 0x80);
        let als_data_gain = (buffer[4] & 0x70) >> 4;

        // Lux
        let lux_ch1 = LTR559.uint16(buffer[1], buffer[0]);
        let lux_ch0 = LTR559.uint16(buffer[3], buffer[2]);

        let lux = 0.0;
        if(0 < (lux_ch0 + lux_ch1)) {
          let ratio = lux_ch1 * 100 / (lux_ch1 + lux_ch0);

          let ch_idx = 3;
          if(ratio < 45) {
            ch_idx = 0;
          } else if(ratio < 64) {
            ch_idx = 1;
          } else if(ratio < 85) {
            ch_idx = 2;
          }

          let gain = this.ALS_GAIN[als_data_gain]

          lux = (lux_ch0 * this.ALS_CH0_C[ch_idx]) - (lux_ch1 * this.ALS_CH1_C[ch_idx]);
          lux /= this.ALS_GAIN[als_data_gain];
          lux /= 10000;
        }

        // Proximity
        let proximity = LTR559.uint16(buffer[6] & 0x07, buffer[5]);
        let proximity_saturated = Boolean(buffer[6] & 0x80);

        resolve({
          lux : lux,
          proximity : proximity,
          proximity_saturated : proximity_saturated
        });
      });
    });
  }

  loadDefaults(callback) {
      this.reset()
        .then(() => {
          // Skipping the setting of interrupts for now
          this.i2cBus.writeByte(this.i2cAddress, this.REGISTER_PS_LED, this.LED_PULSE_PERIOD_30 | this.DUTY_CYCLE_100 | this.CURRENT_MA_50, (err) => {
            if(err) {
              return reject(err);
            }
            // Number of pulse 1 (default)
            this.i2cBus.writeByte(this.i2cAddress, this.REGISTER_PS_N_PULSES, 0x01, (err) => {
              if(err) {
                return reject(err);
              }
              // ALS mode Active, ALS Gain 1 lux to 64k lux (default)
              this.i2cBus.writeByte(this.i2cAddress, this.REGISTER_CONTROL_ALS, this.ENABLE_ALS, (err) => {
                if(err) {
                  return reject(err);
                }
                // PS mode Active, Saturation indicator enable
                this.i2cBus.writeByte(this.i2cAddress, this.REGISTER_CONTROL_PS, this.ENABLE_PS | this.ENABLE_SATURATION, (err) => {
                  if(err) {
                    return reject(err);
                  }
                  // PS MEAS Rate 100ms (default)
                  this.i2cBus.writeByte(this.i2cAddress, this.REGISTER_PS_MEAS_RATE, this.PS_MEAS_RATE_100 , (err) => {
                    if(err) {
                      return reject(err);
                    }
                    // ALS MEAS integration time 100ms (default), measure rate 500ms (default)
                    this.i2cBus.writeByte(this.i2cAddress, this.REGISTER_ALS_MEAS_RATE, this.ALS_INTEGRAL_TIME_100 | this.PS_MEAS_RATE_500, (err) => {
                      if(err) {
                        return reject(err);
                      }
                    });
                  });
                });
              });
            });
          });
          callback();
      })
  }

  static LTR559_DEFAULT_I2C_ADDRESS() {
    return 0x23;
  }

  static PART_ID1_LTR559() {
    return 0x92;
  }

  static int16(msb, lsb) {
    let val = LTR559.uint16(msb, lsb);
    return val > 32767 ? (val - 65536) : val;
  }

  static uint16(msb, lsb) {
    return msb << 8 | lsb;
  }

}

module.exports = LTR559;
