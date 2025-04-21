#!/usr/bin/python

from os import listdir, system
from os.path import isfile, join

sourcepath = "/home/pi/dashticz-components/js/components/"
targetpath = "/home/pi/dashticz/js/components/"

files = [f for f in listdir(sourcepath) if isfile(join(sourcepath, f)) and (f[-3:]==".js" or f[-4:]==".css")]

for filename in files:
    if isfile(join(targetpath,filename)):
        print("Found "+targetpath+filename+" will not create symlink!")
    else:
        system("ln -sf "+sourcepath+filename+" "+targetpath+filename)
        print("Created symlink "+targetpath+filename+"!")
