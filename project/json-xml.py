import json
import numpy as np
import csv


with open('./Downloads/datafile.json') as json_data:
    d = json.load(json_data)
    header_length = len(d["fields"])
    t = '<?xml version="1.0"?>'
    t = t + "<DATASET>" 
    data_len  = len(d["data"])
    #print(header_length)
    #print(data_len)
    for i in range(data_len):
    	t = t + "<ROW" + str(i) + ">" 
    	for j in range(header_length):
    		t  =  t +"<" + str(d["fields"][j]["label"])+">"
    		t = t + str(d["data"][i][j])
    		t = t + "</" + str(d["fields"][j]["label"])+">"

    	t = t + "</ROW" + str(i) + ">" 
    t = t + "</DATASET>" 


f = open("./Downloads/datafile.xml","w")
f.close()

f = open("./Downloads/datafile.xml","r+")
f.write(t)
f.close()


