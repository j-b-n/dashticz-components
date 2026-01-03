#!/usr/bin/python

from os import listdir, system, getenv
from os.path import isfile, join
from dotenv import load_dotenv

load_dotenv()

sourcepath = "/home/pi/dashticz-components/js/components/"
targetpath = getenv('DASHTICZ_COMPONENTS_PATH', '/home/pi/dashticz/js/components/')

files = [f for f in listdir(sourcepath) if isfile(join(sourcepath, f)) and (f[-3:]==".js" or f[-4:]==".css")]

for filename in files:
    if isfile(join(targetpath,filename)):
        system("rm "+targetpath+filename)
        print("Delete symlink "+targetpath+filename+"!")

files = [f for f in listdir(sourcepath) if isfile(join(sourcepath, f)) and (f[-3:]==".js" or f[-4:]==".css")]

for filename in files:
    if isfile(join(targetpath,filename)):
        system("rm "+targetpath+filename)
        print("Delete symlink "+targetpath+filename+"!")
