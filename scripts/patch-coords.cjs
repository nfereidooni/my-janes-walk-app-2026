const fs = require("fs");
const path = require("path");

const WALKS_PATH = path.join(__dirname, "..", "app", "data", "walks.json");

// Manually researched coordinates for all unmapped walks
const patches = {
  901:   { lat: 43.6491,  lng: -79.3729,  displayName: "King St E & Church St, Toronto" },
  1201:  { lat: 43.6536,  lng: -79.3925,  displayName: "Art Gallery of Ontario area, 317 Dundas St W, Toronto" },
  1401:  { lat: 43.7494,  lng: -79.2056,  displayName: "Guildwood Pkwy & Livingston Rd, Scarborough" },
  1501:  { lat: 43.6529,  lng: -79.3847,  displayName: "Nathan Phillips Square, Toronto" },
  1601:  { lat: 43.6410,  lng: -79.3769,  displayName: "Jack Layton Ferry Terminal, 9 Queens Quay W, Toronto" },
  1701:  { lat: 43.8701,  lng: -78.9431,  displayName: "900 Brock St S, Whitby, ON" },
  1901:  { lat: 43.6770,  lng: -79.4578,  displayName: "Weston Rd & St Clair Ave W, Toronto" },
  2001:  { lat: 43.7016,  lng: -79.3437,  displayName: "East York Town Centre, 45 Overlea Blvd, Toronto" },
  2101:  { lat: 43.6775,  lng: -79.3607,  displayName: "Castle Frank Subway Station, Toronto" },
  2201:  { lat: 43.6415,  lng: -79.3446,  displayName: "39 Commissioners St, Port Lands, Toronto" },
  2401:  { lat: 43.6481,  lng: -79.3975,  displayName: "401 Richmond St W, Toronto" },
  2501:  { lat: 43.8487,  lng: -79.0303,  displayName: "Ajax Town Hall, 65 Harwood Ave S, Ajax, ON" },
  2701:  { lat: 43.6654,  lng: -79.4044,  displayName: "Bloor St W & Spadina Ave, Toronto" },
  2901:  { lat: 43.6467,  lng: -79.5243,  displayName: "Islington Ave & Bloor St W, Toronto" },
  3401:  { lat: 43.6368,  lng: -79.5356,  displayName: "Kipling Subway Station, Toronto" },
  3501:  { lat: 43.6484,  lng: -79.3740,  displayName: "Berczy Park, 35 Scott St, Toronto" },
  3801:  { lat: 43.6713,  lng: -79.3278,  displayName: "Coxwell Ave & Gerrard St E, Little India, Toronto" },
  3901:  { lat: 43.6631,  lng: -79.3920,  displayName: "Queen's Park Crescent E & Grosvenor St, Toronto" },
  4301:  { lat: 43.6544,  lng: -79.4011,  displayName: "Dundas St W & Augusta Ave, Kensington Market, Toronto" },
  4501:  { lat: 43.6598,  lng: -79.4393,  displayName: "Bloor St W & Dufferin St, Toronto" },
  4601:  { lat: 43.6463,  lng: -79.3888,  displayName: "David Pecaut Square, Toronto" },
  4901:  { lat: 43.6849,  lng: -79.7596,  displayName: "Brampton City Hall, 2 Wellington St W, Brampton, ON" },
  5001:  { lat: 43.7291,  lng: -79.3437,  displayName: "Lawrence Ave E & Leslie St, Don Mills, Toronto" },
  5201:  { lat: 43.7510,  lng: -79.2435,  displayName: "Bellamy Rd S & Lawrence Ave E, Bendale, Scarborough" },
  5301:  { lat: 43.6529,  lng: -79.3847,  displayName: "Nathan Phillips Square, Toronto" },
  5901:  { lat: 43.6823,  lng: -79.3278,  displayName: "Coxwell Subway Station, Toronto" },
  6301:  { lat: 43.6879,  lng: -79.3923,  displayName: "St. Clair Subway Station, Pleasant Blvd exit, Toronto" },
  6401:  { lat: 43.6455,  lng: -79.3335,  displayName: "Don Roadway & Lakeshore Blvd E, Port Lands, Toronto" },
  6701:  { lat: 43.6720,  lng: -79.2933,  displayName: "Neville Park Blvd & Queen St E, The Beaches, Toronto" },
  6901:  { lat: 43.6489,  lng: -79.3712,  displayName: "Front St E & Jarvis St, St. Lawrence Market, Toronto" },
  7101:  { lat: 43.6405,  lng: -79.4448,  displayName: "Wilson Park Rd & King St W, Parkdale, Toronto" },
  8101:  { lat: 43.6713,  lng: -79.3321,  displayName: "Rhodes Ave & Gerrard St E, Greenwood-Coxwell, Toronto" },
  8401:  { lat: 43.6507,  lng: -79.3870,  displayName: "Queen St W & Simcoe St (Campbell House Museum), Toronto" },
  8801:  { lat: 43.9212,  lng: -79.1995,  displayName: "7445 Elgin Mills Rd E, Markham, ON" },
  9101:  { lat: 43.6891,  lng: -79.3609,  displayName: "Broadview Ave & Pottery Rd, Toronto" },
  9601:  { lat: 43.7494,  lng: -79.2056,  displayName: "Guildwood Pkwy & Livingston Rd, Scarborough" },
  9901:  { lat: 43.6529,  lng: -79.3847,  displayName: "Nathan Phillips Square, Toronto" },
  10101: { lat: 43.6618,  lng: -79.4153,  displayName: "Grace St & College St, Little Italy, Toronto" },
  10201: { lat: 43.6525,  lng: -79.3872,  displayName: "Queen St W & University Ave, Toronto" },
  10501: { lat: 43.6529,  lng: -79.3847,  displayName: "Nathan Phillips Square, Toronto" },
  10701: { lat: 43.6625,  lng: -79.4133,  displayName: "Margaret Fairley Park, Brunswick Ave & Ulster St, Toronto" },
  11001: { lat: 43.7782,  lng: -79.4220,  displayName: "Edithvale Park, Willowdale, Toronto" },
  11401: { lat: 43.6374,  lng: -79.3980,  displayName: "Queens Quay W & Dan Leckie Way, Toronto" },
  11601: { lat: 43.6544,  lng: -79.4646,  displayName: "Bloor St W & High Park Ave, Toronto" },
  11701: { lat: 43.6924,  lng: -79.3043,  displayName: "Main St & Danforth Ave, Toronto" },
  11801: { lat: 43.5837,  lng: -79.6151,  displayName: "3045 Little John Ln, Mississauga, ON" },
  11901: { lat: 43.6534,  lng: -79.4490,  displayName: "2201 Dundas St W & Roncesvalles Ave, Toronto" },
  12901: { lat: 43.6175,  lng: -79.4948,  displayName: "Mimico Ave & Lakeshore Blvd W, Etobicoke" },
  13001: { lat: 43.6546,  lng: -79.3806,  displayName: "CF Toronto Eaton Centre, 220 Yonge St, Toronto" },
  13401: { lat: 43.6505,  lng: -79.4763,  displayName: "Runnymede Subway Station, Toronto" },
  13501: { lat: 43.6548,  lng: -79.4015,  displayName: "Spadina Ave & St. Andrews St, Toronto" },
  13601: { lat: 43.6608,  lng: -79.4116,  displayName: "Harbord St & Bathurst St, Toronto" },
  13701: { lat: 43.6617,  lng: -79.3981,  displayName: "St. George St & Hoskin Ave, U of T, Toronto" },
  13801: { lat: 43.7138,  lng: -79.3996,  displayName: "Snider Parkette, Yonge St & Lytton Blvd, Toronto" },
  14001: { lat: 43.6720,  lng: -79.2985,  displayName: "Toronto Public Library Beaches Branch, Queen St E & Lee Ave, Toronto" },
  14201: { lat: 43.7354,  lng: -79.4033,  displayName: "Yonge Blvd Parkette, Yonge St & Yonge Blvd, Toronto" },
  14401: { lat: 43.6922,  lng: -79.4656,  displayName: "Caledonia LRT Station, Eglinton Ave W, Toronto" },
  14501: { lat: 43.6742,  lng: -79.4467,  displayName: "Prospect Cemetery, 1450 St. Clair Ave W, Toronto" },
  14701: { lat: 43.6383,  lng: -79.3987,  displayName: "Telegram Mews & Iceboat Terrace, Cityplace, Toronto" },
  15001: { lat: 43.6562,  lng: -79.3802,  displayName: "Sankofa Square (Yonge-Dundas Square), Toronto" },
  15101: { lat: 43.5940,  lng: -79.6395,  displayName: "Community Common Park, 34 Princess Royal Dr, Mississauga, ON" },
  15201: { lat: 43.6973,  lng: -79.5087,  displayName: "324 Scarlett Rd, Toronto" },
};

const walks = JSON.parse(fs.readFileSync(WALKS_PATH, "utf8"));

let patched = 0;
for (const w of walks) {
  const p = patches[w.id];
  if (p) {
    w.lat = p.lat;
    w.lng = p.lng;
    w.displayName = p.displayName;
    patched++;
  }
}

fs.writeFileSync(WALKS_PATH, JSON.stringify(walks, null, 2) + "\n");
console.log(`Patched ${patched} walks. Total walks: ${walks.length}`);

// Verify
const remaining = walks.filter(w => !Number.isFinite(w.lat) || !Number.isFinite(w.lng));
console.log(`Still missing coordinates: ${remaining.length}`);
if (remaining.length > 0) {
  remaining.forEach(w => console.log(` - ID ${w.id}: ${w.title}`));
}
