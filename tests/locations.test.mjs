import test from 'node:test';
import assert from 'node:assert/strict';
import { jobLocations, locationOptions, locationSearchTerms } from '../scripts/locations.mjs';
const ids = (location, mode = 'Not specified') => jobLocations(location, mode).map(place => place.id);

test('city filters include multi-city roles and normalize common city aliases', () => {
  assert.deepEqual(ids('Bengaluru / Chennai, India'), ['bengaluru', 'chennai']);
  assert.deepEqual(ids('Bangalore, Karnataka, India'), ['bengaluru']);
  assert.deepEqual(ids('New Delhi / Noida / Gurugram, India'), ['delhi-ncr']);
  assert.deepEqual(ids('Hyderabad or Pune, India'), ['hyderabad', 'pune']);
  assert.deepEqual(ids('Mumbai; Chennai, India'), ['mumbai', 'chennai']);
  assert.deepEqual(ids('Kochi / Pune, India'), ['place-kochi', 'pune']);
  assert.match(locationSearchTerms('Bengaluru, India', 'On-site'), /Bangalore/);
});

test('country-only jobs are not automatically remote or matched to every city', () => {
  assert.deepEqual(ids('India'), ['city-unspecified']);
  assert.deepEqual(ids('India', 'Remote'), ['city-unspecified', 'remote']);
  assert.deepEqual(ids('Bengaluru, India', 'Remote'), ['bengaluru', 'remote']);
  assert.deepEqual(ids('Bengaluru, India', 'Hybrid'), ['bengaluru']);
  assert.deepEqual(ids('Kochi, India'), ['place-kochi']);
});

test('location counts count a job once per city and retain new cities', () => {
  const jobs = [
    {location:'Bangalore / Bengaluru / Chennai, India',work_mode:'On-site'},
    {location:'India',work_mode:'Remote'},
    {location:'Bengaluru, India',work_mode:'Hybrid'},
    {location:'Kochi, India',work_mode:'On-site'},
  ];
  assert.deepEqual(Object.fromEntries(locationOptions(jobs).map(place => [place.id, place.count])), {
    bengaluru:2, chennai:1, 'city-unspecified':1, 'place-kochi':1, remote:1,
  });
});
