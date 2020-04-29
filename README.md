# NOTE: This project is no longer maintained!

Runtastic finally listened to the users and provided GPX files including heart rate and altitude data in the official data backup.

Therefore this tool is no longer needed. Many thanks to all who have contributed here!

Read more about it here:

https://help.runtastic.com/hc/en-us/articles/360000953365-Export-Account-Data

# runtastic-gpx

💪 Converts runtastic exports to gpx

Check out the list of [supported types](#supported-types)

## Prerequisites

[Latest node and npm](https://nodejs.org)

## Instructions

1. Export entire account data and unzip:
   https://help.runtastic.com/hc/en-us/articles/360000953365-Export-Account-Data

2. Follow usage below

## Use the CLI version

```sh
$ npx runtastic-gpx <json-export> <output>
```

Example:

```sh
$ npx runtastic-gpx ~/Desktop/export-20190101-000 ~/Downloads/export
```

## Did it work well for you?

I made this tool in my free time. If you liked it, please consider:

- [Buying me a coffee](https://buymeacoff.ee/glennreyes) or
- [Donate via Paypal](https://paypal.me/glnnrys)

## Supported types

- Run
- Nordic Walking
- Cycling
- Mountain Biking
- Other
- Skating
- Hiking
- Cross Country Skiing
- Skiing
- Snow Boarding
- Motorbiking
- Driving
- Snowshoeing
- Indoor Run
- Indoor Ride
- Elliptical
- Rowing
- Swimming
- Walk
- Riding
- Golfing
- Race Cycling
- Tennis
- Badminton
- Sailing
- Windsurfing
- Pilates
- Climbing
- Frisbee
- Weight Training
- Volleyball
- Handbike
- Cross Skating
- Soccer
- Smovey Walking
- Nordic Cross Skating
- Surfing
- Kite Surfing
- Kayaking
- Paragliding
- Wake Boarding
- Freecrossen
- Back Country Skiing
- Ice Skating
- Sledding
- Snowman Building
- Snowball Fight
- Curling
- Ice Stock
- Biathlon
- Kite Skiing
- Speed Skiing
- Crossfit
- Ice Hockey
- Skateboarding
- Rugby
- Standup Paddling

## License

MIT
