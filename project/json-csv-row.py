import json
import numpy as np
import csv
import sys
a = sys.argv

with open('./Downloads/datafile.json') as json_data:
    d = json.load(json_data)
    header_length = len(d["fields"])
    header = []
    data = []
    temp = d["fields"][0]["label"]
    for i in range(1,header_length):
    	temp = temp + "," + str(d["fields"][i]["label"])

    if len(a) > 1:
    	length = int(a[1])
    else:
    	length = len(d["data"])

    for i in range(length):
    	data.append(d["data"][i])
    #print(data)
    np.savetxt("./Downloads/datafile.csv",  data,fmt='%5s', delimiter=",",header=temp)
