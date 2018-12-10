import sys
import json
a = sys.argv


with open('./Downloads/datafile.json') as json_data:
    d = json.load(json_data)
    dict = {"fields":[],"data":[]}
    dict['fields'] = d['fields']
    if len(a) > 1:
    	length = int(a[1])
    else:
    	length = len(d["data"])

    for i in range(length):
    	dict['data'].append(d["data"][i])

    #print(dict)


with open('./Downloads/datafile.json', 'w') as fp:
    json.dump(dict, fp)
