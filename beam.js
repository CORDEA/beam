/**
 *
 * Copyright 2017 Yoshihiro Tanaka
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Author: Yoshihiro Tanaka <contact@cordea.jp>
 * date  : 2017-04-16
 */

let Nightmare = require('nightmare');
let nodemailer = require('nodemailer');
let Xvfb = require('xvfb');

let nightmare = Nightmare();

let to = process.env.BEAM_TO_ADDRESS;
let user = process.env.BEAM_FROM_ADDRESS;
let pass = process.env.BEAM_FROM_PASS;
let from = user + '@yahoo.com';

console.log('Send from ' + from);
console.log('Send to ' + to);

let transporter = nodemailer.createTransport({
  host: 'smtp.mail.yahoo.com',
  port: 465,
  auth: {
    user: user,
    pass: pass
  }
});

let xvfb = new Xvfb({
  silent: true
});
xvfb.startSync();

nightmare
  .goto(process.env.BEAM_BASE_URL)
  .on('console', function(type, arg) {
    console.log(arg);
  })
  .wait('#store_product_variant')
  .evaluate(function () {
    var elems = document
      .querySelectorAll('#store_product_variant .store_select_variant option');
    return Array.prototype
      .map.call(Array.prototype
        .filter.call(elems, function(x) {
          return x.innerText !== '選択';
        }), function(x) {
          return x.innerText;
        });
  })
  .end()
  .then(function (result) {
    let text = 'There was no choice.';
    if (result.length !== 0) {
        text = 'Choices found.\n\n'
        text += result.join('\n');
    }
    let mailOptions = {
      from: from,
      to: to,
      subject: 'From Beam',
      text: text,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
    });
    xvfb.stopSync();
  })
  .catch(function (error) {
    console.error('failed: ', error);
    xvfb.stopSync();
  });
