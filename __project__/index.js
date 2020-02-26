const csv = require("csv-parser");
const fs = require("fs");

const api_key = "AIzaSyDJP4plzToJcFVB0CAsAEbUOzQYGjIatBE";
const googleMapsClient = require('@google/maps').createClient({key: api_key});


let address_array = [];

let origin_address_array = [];
let destin_address_array = [];

const matrix_count_limit = 10;
const time_delay_seconds = 1000; // ms

fs.createReadStream('data.csv')
    .pipe(csv())
    .on('data', (data) => {
        address_array.push(data);
    })
    .on('end', async () => {
        try {
            // console.log(address_array);

            for (let i = 1; i < address_array.length; i++) {
                let or = address_array[i - 1];
                let de = address_array[i];
                let origin_address = or['Street'] + ', ' + or['City'] + ', ' + or['Province'];// + ', ' + or['Postal'];
                let destin_address = de['Street'] + ', ' + de['City'] + ', ' + de['Province'];// + ', ' + de['Postal'];
                origin_address_array.push(origin_address);
                destin_address_array.push(destin_address);
            }

            // console.log(origin_address_array.length);
            // console.log(origin_address_array);
            // console.log(destin_address_array);

            // TODO: implement calculating distances per day :-(

            let total_distance_value = 0;
            let call_count = 0, current_index = 0;
            // total_distance_value = await getDistanceForTenAddresses(origin_address_array, destin_address_array);
            while (current_index < origin_address_array.length) {
                let next_index = current_index + matrix_count_limit;
                if (next_index > origin_address_array.length) {
                    next_index = origin_address_array.length;
                }
                let sub_origins = origin_address_array.slice(current_index, next_index);
                let sub_destins = destin_address_array.slice(current_index, next_index);
                let sub_total_distance = await getDistanceForTenAddresses(sub_origins, sub_destins);
                total_distance_value += sub_total_distance;
                call_count++;
                console.log('sub total distance (', call_count,'): ', sub_total_distance / 1000, 'km');
                current_index = next_index;
                await new Promise(resolve => setTimeout(resolve, time_delay_seconds));
            }
            console.log('total distance =', total_distance_value / 1000, 'km');

        } catch (e) {
            console.log(e.message);
        }
    });

async function getDistanceForTenAddresses(origins, destinations) {
    return new Promise(async resolve => {
        if (!origins || !origins.length || !destinations || !destinations.length) {
            resolve(0);
        }

        googleMapsClient.distanceMatrix({
            origins: origins,
            destinations: destinations
        }, function (error, response) {
            let sub_total_distance = 0;
            if (!error) {
                // console.log(response.json);

                let rows = response.json.rows;
                for (let j = 0; j < rows.length; j++) {
                    let distance_text = rows[j].elements[j].distance.text;
                    let distance_value = rows[j].elements[j].distance.value;
                    sub_total_distance += distance_value;
                    console.log(distance_text);
                }
            } else {
                console.log('error from api');
                if (error.status === 200) {
                    console.log(error.json.status);
                } else {
                    console.log(error.statusMessage);
                }
            }
            resolve(sub_total_distance)
        });
    });
}