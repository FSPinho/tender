# -*- coding:UTF-8 -*-

import codecs
import json
import os
import sys
import base64
import hashlib
from os import walk

DEBUG=False
DEBUG_DATA_MAX_LENGTH=1024*4


def _show_progress(label='', progress=0, total=0):
	line = '\r'

	line += '%s - PER - ' % label 
	line += '%6.2f%% done=%d total=%d' % (
		float(float(progress)/float(total)) * 100.0, 
		progress,
		total,
	)

	rows, columns = os.popen('stty size', 'r').read().split()
	progressWidth = int(columns) - len(line) - 3
	progressS = ''
	for i in range (progressWidth):
		if i <= float(progress) / float(total) * float(progressWidth):
			progressS += '▓'
		else:
			progressS += '░'
	line = line.replace('PER', progressS)

	sys.stdout.write(line)
	sys.stdout.flush()

def _load_json(path):
	try:
		file = codecs.open(path, encoding='UTF-8')
		data = json.loads(file.read())
		file.close()
		return data
	except:
		return None

def _save_json(path, data, indent=None):
	file = codecs.open(path, 'w', encoding='UTF-8')
	file.write(json.dumps(data, ensure_ascii=False, indent=indent))
	file.close()
	return data

def _get_key(s):
	hasher = hashlib.sha1(s)
	return base64.urlsafe_b64encode(hasher.digest()[:10]).rstrip('=')

def _get_questions():

	data = _load_json('questions.json')
	
	if data:
		return data

	fs = []
	for (dirpath, dirnames, filenames) in walk('.cache'):
	    fs.extend(filenames)
	    break
	fs = filter(lambda x: x.startswith('question_'), fs)

	if DEBUG:
		fs = fs[:DEBUG_DATA_MAX_LENGTH]

	questions = []
	_show_progress("Loading questions", 0, len(fs))
	for i, f in zip(range(len(fs)), fs):
		q = _load_json('.cache/%s' % f)
		if q:
			questions.append(q)
		_show_progress("Loading questions", i + 1, len(fs))
	print ''

	_save_json('./questions.json', questions)

	return questions


def _do_compile():
	questions = _get_questions()
	data = _load_json('./data-2.json')
	bancas = data['bancas']
	subjects = data['subjects']
	levels = data['levels']
	collisions = 0

	yearsMap = {}
	for q in questions:
		if q:
			yearsMap[q['y']] = True
	years = yearsMap.keys()

	bancasMap = {}
	for b in bancas:
		
		if _get_key(b['id']) in bancasMap:
			# print 'Collision in bancasMap %s' % _get_key(b['id'])
			collisions += 1

		bancasMap[_get_key(b['id'])] = {
			't': b['name']
		}

	levelsMap = {}
	for l in levels:
		levelsMap[_get_key(l['id'])] = {
			't': l['id']
		}

	subjectsMap = {}
	topicsMap = {}
	subjectsTopicsMap = {}
	for s in subjects:
		
		if _get_key(s['id']) in subjectsMap:
			# print 'Collision in subjectsMap %s' % _get_key(s['id'])
			collisions += 1

		subjectsMap[_get_key(s['id'])] = {
			't': s['name']
		}
		subjectsTopicsMap[_get_key(s['id'])] = {
			't': s['name'],
			'o': {},
			'c': 0
		}
		for t in s['topics']:

			if _get_key(t['id']) in topicsMap:
				# print 'Collision in topicsMap %s %s' % (_get_key(t['id']), t['id'])
				collisions += 1

			topicsMap[_get_key(t['id'])] = {
				't': t['name'],
				's': _get_key(s['id'])
			}
			subjectsTopicsMap[_get_key(s['id'])]['o'][_get_key(t['id'])] = {
				't': t['name'],
				'c': 0
			}

	questionsMap = {}
	skipped = 0
	question_index = 0
	for q in questions:
		if q:
			_q = {
				't': _get_key(q['t']),
				's': _get_key(q['s']),
				'b': _get_key(q['b']),
				'y': q['y'],
				
				'c': q['c'],
				'p': filter(lambda x: not not x, q['p']),
				'a': q['a'],
			}

			cAnswers = len(filter(lambda x: 'c' in x, q['a']))
			if q and 'p' in q and len(_q['p']) and cAnswers == 1:
				subjectsTopicsMap[_q['s']]['c'] += 1
				subjectsTopicsMap[_q['s']]['o'][_q['t']]['c'] += 1
				_q['x'] = question_index
				question_index += 1
				questionsMap[_get_key(q['i'])] = _q
			else:
				print 'Skipped due no text'
				skipped += 1
		else:
			print 'Skippedd due None'
			skipped += 1
	print 'Skipped questions: %d' % skipped
	print 'Collisions: %d' % collisions
	print 'Questions length: %d' % question_index


	return {
		'public': {
			'subjects': subjectsMap,
			'topics': topicsMap,
			'subjects-topics': subjectsTopicsMap,
			'bancas': bancasMap,
			'questions': questionsMap,
			'questions_count': question_index
		}
	}




data = _do_compile()
_save_json('./compiled.json', data, 4)