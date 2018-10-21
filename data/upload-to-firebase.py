
import json
import hashlib
import base64
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def _get_key(s):
	hasher = hashlib.sha1(str(s))
	return base64.urlsafe_b64encode(hasher.digest()[:10]).rstrip('=')

cred = credentials.Certificate("./cytech-tender-firebase-keys.json")
firebase_admin.initialize_app(cred)

def _add_questions():
	file = open('./compiled.json')
	data = json.loads(file.read())
	file.close()

	topic = "9zI5cw9aMpnjMg"
	subject = "jFp2yEPhq07csQ"

	db = firestore.client()

	for k, q in data['public']['questions'].iteritems():
		if q['s'] == subject and q['t'] == topic:
			print 'Uploading question %s' % k
			db.collection(u'questions').document(k).set(q)


def _add_metadata():
	file = open('./compiled.json')
	data = json.loads(file.read())
	file.close()

	data = data['public']
	del data['questions']

	db = firestore.client()

	for collection, val in data.iteritems():
		for k, v in val.iteritems():
			print 'Uploading %s %s' % (collection, k)
			db.collection(collection).document(k).set(v)
			


_add_questions()
# _add_metadata()