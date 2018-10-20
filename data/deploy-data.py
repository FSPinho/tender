import json
import sys
import re
import codecs

print 'Deploying collected data...'

file = codecs.open('./data.json', encoding='utf-8')
data = json.loads(file.read())
file.close()


## ... 
for k1, block in data.iteritems():
	for k2, item in block['items'].iteritems():
		file = codecs.open('../app/android/app/src/main/assets/data/%s-%s.json' % (k1, k2), 'w', encoding='utf-8')
		file.write(
			json.dumps(item['questions'], ensure_ascii=False, indent=None)
		)
		file.close()
		del item['questions']


file = codecs.open('../app/android/app/src/main/assets/data/blocks.json', 'w', encoding='utf-8')
file.write(
	json.dumps(data, ensure_ascii=False, indent=None)
)
file.close()


print 'Checking json...'


file = codecs.open('../app/android/app/src/main/assets/data/blocks.json', encoding='utf-8')
data = file.read()
data = json.loads(data)
file.close()

for k1, block in data.iteritems():
	for k2, item in block['items'].iteritems():
		file = codecs.open('../app/android/app/src/main/assets/data/%s-%s.json' % (k1, k2), encoding='utf-8')
		questions = json.loads(file.read())
		file.close()


print 'Done!'