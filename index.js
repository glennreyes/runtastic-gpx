const chalk = require('chalk');
const fs = require('fs');
const ora = require('ora');
const util = require('util');

const FILES_PER_SEGMENT = 25;
const SPORT_TYPES = {
  basketball: '45', // Unsupported
  crossfit: '69',
  elliptical: '16',
  indoor_ride: '15',
  indoor_run: '14',
  ride: '3',
  roadbike: '22',
  run: '1',
  walk: '19',
  weight_training: '34',
  swim: '18',
  //there is no pilates,tennis, mountain_bike
  pilates: '31',
  //no tennis either (23)
  tennis: '31',
  mountain_bike: '4',
  other: '5',
  hike: '7',
  cycling_ergometer: '15',
  inline_skating: '6',  
};

const parse = buffer => {
  const str = buffer.toString();

  try {
    const content = JSON.parse(str);

    return content;
  } catch (error) {
    throw error;
  }
};

const filterContent = content => {
  return content.filter(item =>
    Object.values(SPORT_TYPES).includes(item.sport_type_id),
  );
};

const matchGpsWithHeartRate = hr => gps =>
  hr.timestamp === gps.timestamp ||
  hr.duration === gps.duration ||
  hr.distance === gps.distance;

const nearestDate = (dates, target) => {
  const targetDate = new Date(target);
  let nearestDistance = Infinity;
  let nearestDate = null;

  dates.forEach(date => {
    const distance = Math.abs(new Date(date) - targetDate);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestDate = date;
    }
  });

  return nearestDate;
};

const createFolder = path =>
  util
    .promisify(fs.mkdir)(path, {
      recursive: true,
    })
    .catch(console.error);

const template = (data, name) => {
  const hourStarted = new Date(data.start_time).getHours();
  const dayTime =
    hourStarted >= 0 && hourStarted < 4
      ? 'Night'
      : hourStarted < 11
      ? 'Morning'
      : hourStarted < 4
      ? 'Lunch'
      : hourStarted < 18
      ? 'Afternoon'
      : hourStarted < 22
      ? 'Evening'
      : 'Night';
  const type = name === 'Run' ? 9 : name === 'Ride' ? 1 : '';
  return `
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <link href="http://www.garmin.com">
      <text>Garmin International</text>
    </link>
    <time>${new Date(data.created_at).toISOString()}</time>
  </metadata>
  <trk>
    <name>${dayTime} ${name}</name>${
    type
      ? `
    <type>${type}</type>
    `.trim()
      : ''
  }
    <trkseg>
      ${
        Array.isArray(data.gps) && data.gps.length > 0
          ? `
      ${data.gps
        .map(gpsItem => {
          const heartRate =
            data.heart_rate &&
            Array.isArray(data.heart_rate) &&
            data.heart_rate.some(matchGpsWithHeartRate(gpsItem))
              ? data.heart_rate.find(matchGpsWithHeartRate(gpsItem)).heart_rate
              : ''
              ? data.heart_rate.find(
                  hr =>
                    new Date(hr.timestamp).getTime() ===
                    nearestDate(
                      data.heart_rate.map(h => h.timestamp),
                      gpsItem.timestamp,
                    ),
                ).heart_rate
              : null;

          return `
      <trkpt lon="${gpsItem.longitude}" lat="${gpsItem.latitude}">
        <ele>${gpsItem.altitude}</ele>
        <time>${new Date(gpsItem.timestamp).toISOString()}</time>${
            heartRate
              ? `
        <extensions>
          <gpxtpx:TrackPointExtension>
          <gpxtpx:hr>${heartRate}</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
        `.trim()
              : ''
          }
      </trkpt>`;
        })
        .join('')
        .trim()}`.trim()
          : data.heart_rate &&
            Array.isArray(data.heart_rate) &&
            data.heart_rate.length > 0
          ? data.heart_rate
              .map(
                heartRate => `
        <trkpt lon="0" lat="0">
          <time>${new Date(heartRate.timestamp).toISOString()}</time>
          <extensions>
            <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>${heartRate.heart_rate}</gpxtpx:hr>
            </gpxtpx:TrackPointExtension>
          </extensions>
        </trkpt>`,
              )
              .join('')
              .trim()
          : ''
      }</trkseg>
  </trk>
</gpx>
`.trim();
};

let amountExportedFiles = 0;

const start = async ([exportPath, outputPath = `${process.cwd()}/export`]) => {
  const exportSession = async (data, type) => {
    const name = type
      .replace('indoor_', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    const prefix = chalk.gray(
      `${type.startsWith('indoor') ? 'Indoor ' : ''}${name} `,
    );

    const dataSpinner = ora(`${prefix}Load GPS and heart rate data`).start();
    const sessions = await Promise.all(
      data
        .filter(item => SPORT_TYPES[type] === item.sport_type_id)
        .map(async item => {
          const gpsPath = `${exportPath}/Sport-sessions/GPS-data/${item.id}.json`;
          const heartRatePath = `${exportPath}/Sport-sessions/Heart-rate-data/${item.id}.json`;

          let gpsFile = null;
          let heartRateFile = null;

          if (fs.existsSync(gpsPath)) {
            gpsFile = await util
              .promisify(fs.readFile)(gpsPath)
              .catch(console.error);
          }

          if (fs.existsSync(heartRatePath)) {
            heartRateFile = await util
              .promisify(fs.readFile)(heartRatePath)
              .catch(console.error);
          }

          return {
            ...item,
            gps: gpsFile ? parse(gpsFile) : [],
            heart_rate: heartRateFile ? parse(heartRateFile) : [],
          };
        }),
    );
    dataSpinner.succeed();

    const exportSpinner = ora(`${prefix}Export GPX files`).start();

    let amountExportedSegmentFiles = 0;

    await Promise.all(
      sessions
        .filter(
          session =>
            !(
              ((type === 'ride' || type === 'run') &&
                session.gps.length === 0) ||
              ((type === 'indoor_ride' || type === 'indoor_run') &&
                session.heart_rate.length === 0)
            ),
        )
        .map(async session => {
          amountExportedFiles++;
          amountExportedSegmentFiles++;
          const segment =
            Math.round(amountExportedFiles / FILES_PER_SEGMENT) + 1;
          const segmentPath = `${outputPath}/${type}/${segment}`;

          if (!fs.existsSync(segmentPath)) {
            await createFolder(segmentPath);
          }

          return util
            .promisify(fs.writeFile)(
              `${segmentPath}/${session.id}.gpx`,
              template(session, name),
            )
            .catch(console.error);
        }),
    );
    exportSpinner.succeed();
  };

  const exportAllSessions = async data => {
    await exportSession(data, 'ride');
    await exportSession(data, 'run');
    await exportSession(data, 'roadbike');
    await exportSession(data, 'indoor_ride');
    await exportSession(data, 'indoor_run');
    await exportSession(data, 'elliptical');
    await exportSession(data, 'weight_training');
    await exportSession(data, 'crossfit');
    await exportSession(data, 'walk');
    await exportSession(data, 'swim');
    await exportSession(data, 'pilates');
    await exportSession(data, 'tennis');
    await exportSession(data, 'mountain_bike');
    await exportSession(data, 'other');
    await exportSession(data, 'hike');
    await exportSession(data, 'cycling_ergometer');
    await exportSession(data, 'inline_skating');    

    console.log(
      `\n${chalk.green(
        amountExportedFiles,
      )} activities successfully exported to ${chalk.yellow(outputPath)}. 💃`,
    );
  };

  const filesSpinner = ora(`Load all activities`).start();
  const files = await util
    .promisify(fs.readdir)(`${exportPath}/Sport-sessions`)
    .catch(console.error);

  const content = await Promise.all(
    files
      .filter(file => file.endsWith('.json'))
      .map(async file => {
        const data = await util
          .promisify(fs.readFile)(`${exportPath}/Sport-sessions/${file}`)
          .catch(console.error);

        return data ? parse(data) : null;
      }),
  );

  const compact = content.filter(Boolean);
  const data = filterContent(compact);
  filesSpinner.succeed();

  await exportAllSessions(data);
};

module.exports = start;
