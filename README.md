## stairsJs
is a minimal NodeJS app for a rapberry pi-3 to automatically drive the stairs LED lights (14 steps) using IR detection.
It uses logging (bunyan) and of course GPIO (onoff).

## Purpose 
The goal of this project is to build a nice led-light for my stairs (which I renovated recently) and to learn the raspberry PI, nodeJS and GPIO programming

## Hardware
List of each component and link to specification

![GitHub Logo](/images/logo.png)


| Picture 	| Quantity 	| Component | Remark / Chosen Mode 	|
|---	|---	|---	|---	|
| ![Component1](/doc/components/Components_files/Image01.png)   |  	|  	| 	|
| ![Component2](/doc/components/Components_files/Image02.png) 	|  	|  	| 	|
| ![Component3](/doc/components/Components_files/Image03.png) 	|  	|  	|  	|
| ![Component4](/doc/components/Components_files/Image04.png) 	|  	|  	|  	|
| ![Component5](/doc/components/Components_files/Image05.png) 	|  	|  	|  	|
| ![Component6](/doc/components/Components_files/Image06.png) 	|  	|  	|  	|
| ![Component7](/doc/components/Components_files/Image07.png) 	|  	|  	|  	|

## Electric Scheme

![Schema](/doc/components/Components_files/Schema.png) 

## Pictures


## Installation notes

***Prerequisites***: You need node and npm installed on your RPI system. You can check if you have it installed in a terminal window with:

``` bash
node -v
npm -v
```

To install node + npm execute:
``` bash
curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -
sudo apt-get install -y nodejs
```

***Installation steps:***

1. Fork this package to your github account


2. Clone it from github to your server 
``` bash
git clone https://github.com/[your-account-name-here]/stairsJs.git
```


3. Install its dependencies 
```
npm install
```
NOTE: Use npm install --only=production to install only dependencies, and not devDependencies,regardless of the value of the NODE_ENV environment variable.


4. Run the program

use one of the following commands
``` bash
node stairsJs
npm start
```
or use PM2 (auto starts / auto restart the program after boot)
``` bash
pm2 start stairsJs.js
```
For the last option you need to install PM2. TODO: Provide link/instructions


5. Execute the unit- and integration tests (todo)
```
gulp test
```

## Contribute

Report a bug or a suggestion by posting an issue on the git repository (https://github.com/Vinz68/stairsJs/issues).

 
## TODO List:
 - [ ] include code quality check (JSLint or something else..)     
 - [ ] add hardware overview
 - [ ] add electric scheme
 - [ ] add pictures
 - [ ] add PM2 link/instructions ?

 



