# Dashticz components

### Description
This code only works woth Dashticz, a dashboard solution for [Domoticz](https://github.com/domoticz/domoticz). Dashticz is created and maintained by @lokonli and can be found here https://github.com/Dashticz/dashticz.

This repro is a collection of Dashticz components I have created for my own use and I provide them as is without any guaranties for maintance or functionality. Perhaps you can find something useful.

I decided to create them mainly because I wanted to learn more Javascript and to add new features to my own Dashticz dashboard.

### Documentation
Documentation is available in the [wiki](https://github.com/j-b-n/dashticz-components/wiki) and in the repository under `docs/`.

Repository documentation:

- `docs/architecture.md` for the project structure and component model
- `docs/runbooks/deployment.md` for installation and update steps
- `docs/decisions/` for future architecture decision records


### Prerequisites
- [Domoticz](https://github.com/domoticz/domoticz)
- [Dashticz](https://dashticz.readthedocs.io/en/master/)
- Python 3 with dependencies from `requirements.txt` for local scripts

### Installation
Install by navigating to the folder above your Dashticz folder (example: /home/pi/).
````
Download the latest release
````

For a symlink-based local workflow, see `docs/runbooks/deployment.md`.

Install script dependencies with:
````
python3 -m pip install -r requirements.txt
````

### Update
Update the components with a new release. 
````
Download the latest release
````

If you are developing locally, use the deployment runbook instead of manual copying.

### Dashticz modifications

To simplyfy the loading of custom components the main dashticz loader must be modified. See and use the **dashticz-mod/dashticz.js** file. 

And the web server must allow directory listing for components. For example:
In Apache, add Options +Indexes to the .htaccess or server config for that directory.

**Author**

* [j-b-n](https://github.com/j-b-n)
