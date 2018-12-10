import pandas as pd
import csv
import json

df = pd.read_csv('./Uploads/datafile.csv')
headers = pd.read_csv("./Uploads/datafile.csv", nrows=1).columns

dict = {"fields":[],"data":[]}

ids = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u']
st = {"id":"a","label":"S.No.","type":"string"}

len_h = int(len(headers))
for j in range(0,len_h):
	#print(j)
	#st["label"] = str(headers[j])

	dict["fields"].append({"id":str(ids[j]),"label":str(headers[j]),"type":str("string")})




#print(len(dict["fields"]))

x = df.iloc[:,:].values.tolist()

#print(x)


for i in range(len(x)):
	temp = [str(i) for i in x[i]]

	dict['data'].append(temp)
	#print(headers)






#print(dict)

with open('./Uploads/datafile.json', 'w') as fp:
    json.dump(dict, fp)

