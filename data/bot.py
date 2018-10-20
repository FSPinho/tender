# -*- coding:utf-8 -*-

from bs4 import BeautifulSoup as BS
import re
import urllib2
import urllib
import json
import os
import hashlib
import time
import mechanize
from selenium import webdriver


DEF_MAX_RENTRIES = 30
DEF_MAX_DIFF_COUNT = 100
DEF_RENTRY_DELAY = 5
DEF_PAGE_TRY_COUNT = 1
DEF_CACHE_DIR = '.cache'

DEF_ENABLE_CACHE = True


def _log(text):
	print ' - LOG -', text


def _err(text):
	print ' - ERR -', text


def _show_percent(perc):
	print '\r[',
	for i in range(10):
		print '#' if (i < perc * 10) else ' ',
	print "]"


def _to_bs(html):
	return BS(html, "lxml")


def _pathify(path):
	hash_object = hashlib.md5(path.encode('utf-8'))
	return hash_object.hexdigest()


def _get_data():
	file = open('./data.json')
	data = file.read()
	file.close()
	return data


def _save_data(data):
	file = open('./data.json', 'w')
	file.write(data)
	file.close()


def _get_cached(path):
	if not os.path.exists(DEF_CACHE_DIR):
		os.makedirs(DEF_CACHE_DIR)
		return None

	_path = os.path.join(DEF_CACHE_DIR, _pathify(path))
	
	try:
		file = open(_path)
		data = file.read()
		file.close()
		return data
	except:
		pass

	return None


def _save_to_cache(path, data):
	if not os.path.exists(DEF_CACHE_DIR):
		os.makedirs(DEF_CACHE_DIR)

	_path = os.path.join(DEF_CACHE_DIR, _pathify(path))

	try:
		file = open(_path, 'w')
		data = file.write(data)
		file.close()
		return True
	except Exception as e:
		print e
		pass

	return False


def _clear_text(text):
	text = re.sub(r'^\s*', '', text)
	text = re.sub(r'\s*$', '', text)
	text = re.sub(r'\s+', ' ', text)
	text = re.sub(r'\t+', '\t', text)
	text = re.sub(r'\n+', '\n', text)
	return text


def retrieve_questions(driver):

	_log('Getting questions...')

	old_data = _get_data() if DEF_ENABLE_CACHE else None
	if old_data:
		old_data = json.loads(old_data)

	driver.get('https://www.concursosnobrasil.com.br/questoes/')
	blocks = {}
	bs = _to_bs(driver.page_source)
	question_blocks = bs.select('.list.directory ul.row > li')[0:]

	_log(str(len(question_blocks)) + ' blocks found')

	for block, i in zip(question_blocks, range(len(question_blocks))):
		block_bs = _to_bs(str(block).decode('utf-8'))
		block_title = _clear_text(block_bs.select('span')[0].text)

		_log('Getting block ' + block_title)
		
		items = {}
		block_items = [{ 
			'link': a.get('href'), 
			'title': a.text 
		} for a in block_bs.select('ul li a')]

		for block_item in block_items:
			for i in range(30):
				try:
					questions = {}

					print 'Getting inner page', block_item['title'], block_item['link']

					driver.get(block_item['link'])
					
					block_item_bs = _to_bs(driver.page_source)
					block_item_questions = block_item_bs.select('form .questao')

					form_token = block_item_bs.select('form input[name="csrfmiddlewaretoken"]')[0].get('value')

					for block_item_question in block_item_questions:
						answers = []
						
						block_item_question_bs = _to_bs(str(block_item_question).decode('utf-8'))
						question_html_id = block_item_question.get('id')
						question_text = _clear_text(block_item_question_bs.select('.pergunta')[0].text)
						question_code = block_item_question_bs.select('input[name="' + str(question_html_id) + '"]')[0].get('value')
						question_answers = block_item_question_bs.select('ol li')

						for answer in question_answers:
							answer_bs = _to_bs(str(answer).decode('utf-8'))
							answer_text = _clear_text(answer_bs.select('label')[0].text)
							answer_name = answer_bs.select('input')[0].get('name')
							answer_value = answer_bs.select('input')[0].get('value')
							
							answers.append({
								'text': answer_text,
								'name': answer_name,
								'value': answer_value
							})
						
						questions[question_code] = {
							'id': question_code,
							'html_id': question_html_id,
							'text': question_text,
							'answers': answers,
							"code": question_code
						}

					# ...
					for key, q in questions.iteritems():
						driver.find_element_by_css_selector("input[type='radio'][name='" + q['answers'][0]['name'] + "']").click()

					driver.find_element_by_css_selector("form[name='simulado'] input[type='submit']").click()
					response_page_bs = _to_bs(driver.page_source)

					for key, q in questions.iteritems():
						ress = response_page_bs.select('#' + q['html_id'] + ' .resultado p')
						has_correct = 0
						for r in ress:
							res = _clear_text(r.text)
							if res.split(': ')[0] == 'Resposta do gabarito':
								res = res.split(': ')[1]
								for a in q['answers']:
									if a['value'] == res and res:
										a['correct'] = True
										has_correct += 1
						if has_correct != 1:
							raise ValueError('####### => Inconsistence on correct answer!!!')

					if old_data:
						try:
							old_questions = old_data[_pathify(block_title)]['items'][_pathify(block_item['link'])]['questions']
							for key, q in old_questions.iteritems():
								if not key in questions:
									questions[key] = q
						except:
							pass

					break
				except Exception as e:
					print 'Can\'t get inner page', block_item['title'], block_item['link'], 'rentring...'
					print e
					time.sleep(DEF_RENTRY_DELAY)
			
			items[_pathify(block_item['link'])] = {
				'title': block_item['title'],
				'questions': questions
			}

			# break
		
		blocks[_pathify(block_title)] = {
			'title': block_title,
			'items': items
		}

		# break

	_save_data(json.dumps(blocks, ensure_ascii=False, indent=4).encode('utf-8'))
	return True


def _get_question_length():
	data = _get_data() 

	if data:
		data = json.loads(data)
	else:
		return 0

	length = 0
	for k1, v1 in data.iteritems():
		for k2, v2 in v1['items'].iteritems():
			length += len(v2['questions'])
	return length


driver = webdriver.Firefox()
diff_count = 0

while True:
	length = _get_question_length()	
	if not retrieve_questions(driver):
		break
	new_length = _get_question_length()

	if length == new_length:
		diff_count += 1

		print length, "==", new_length, "(" + str(diff_count) + ")"

		if diff_count >= DEF_MAX_DIFF_COUNT:
			print 'DONE!!!'
			break
	else:
		print length, "!=", new_length
		diff_count = 0
		