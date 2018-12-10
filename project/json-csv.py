import json
import numpy as np
import csv


with open('./Downloads/datafile.json') as json_data:
    d = json.load(json_data)
    header_length = len(d["fields"])
    header = []
    data = []
    temp = d["fields"][0]["label"]
    for i in range(1,header_length):
    	temp = temp + "," + str(d["fields"][i]["label"])
#[1]["label"])
    #print(header)
    len_data = len(d["data"])
    for i in range(len_data):
    	data.append(d["data"][i])
    #print(data)
    np.savetxt("./Downloads/datafile.csv",  data,fmt='%5s', delimiter=",",header=temp)

   # np.savetxt("my_data",np.array(data),header=header)



