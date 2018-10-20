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
import codecs
from selenium import webdriver
import pickle

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


def _get_cached(path, prefix=False):
	if not os.path.exists(DEF_CACHE_DIR):
		os.makedirs(DEF_CACHE_DIR)
		return None

	_path = os.path.join(DEF_CACHE_DIR, (prefix if prefix else '') + _pathify(path))
	
	try:
		file = open(_path)
		data = file.read()
		file.close()
		return data
	except:
		pass

	return None


def _save_to_cache(path, data, prefix=False):
	if not os.path.exists(DEF_CACHE_DIR):
		os.makedirs(DEF_CACHE_DIR)

	_path = os.path.join(DEF_CACHE_DIR, (prefix if prefix else '') + _pathify(path))

	try:
		file = codecs.open(_path, 'w', encoding='UTF-8')
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


def _wait_for(driver, query_selector):
	while True:
		try:
			return driver.find_element_by_css_selector(query_selector)
		except:
			time.sleep(0.1)


def _set_input_value(driver, query_selector, value):
	while True:
		try:
			return driver.find_element_by_css_selector(query_selector).send_keys(value)
		except:
			time.sleep(0.1)


def _click_button(driver, query_selector):
	while True:
		try:
			return driver.find_element_by_css_selector(query_selector).click()
		except:
			time.sleep(0.1)


def save_browser_session(driver):
	pickle.dump(driver.get_cookies() , open(os.path.join(DEF_CACHE_DIR, "browser.cache"),"wb"))


def restore_browser_session(driver):
	for cookie in pickle.load(open(os.path.join(DEF_CACHE_DIR, "browser.cache"),"rb")):
		driver.add_cookie(cookie)


def sign_in(driver):
	_log('Signing in...')

	driver.get('https://www.estudegratis.com.br/')
	driver.find_element_by_css_selector('button.login-usuario').click()
	_set_input_value(driver, 'input[name="m_login"]', 'shullepys@gmail.com')
	_set_input_value(driver, 'input[name="m_senha"]', '76857685')
	driver.find_element_by_css_selector('button#mlogin').click()
	_wait_for(driver, '.top_nav_wrapper.clearfix a.vc_general')

	_log('Signed in!')


def retrieve_refs(driver):
	_log('Looking for questions subjects!')
	
	driver.get('https://www.estudegratis.com.br/questoes-de-concurso')
	subjects_bs = _to_bs(driver.page_source)

	subjects = []
	subjects_els = subjects_bs.select('#load_materias option')
	for subject_el in subjects_els:
		subject_text = subject_el.text
		subject_value = subject_el.get('value')
		if subject_value:
			subjects.append({
				'id': subject_value,
				'name': subject_text
			})

	_log('Found %d subjects' % len(subjects))

	_log('Looking for questions bancas!')
	
	bancas = []
	bancas_els = subjects_bs.select('select[name="banca"] option')
	for banca_el in bancas_els:
		banca_text = banca_el.text
		banca_value = banca_el.get('value')
		if banca_value:
			bancas.append({
				'id': banca_value,
				'name': banca_text
			})

	_log('Found %d bancas' % len(bancas))
	
	_log('Looking for questions topics!')
	for s in subjects:
		# _log(' - Getting topics for %s' % s['name'])

		_last = None
		topics = []

		_click_button(driver, '#load_materias option[value="%s"]' % s['id'])

		while True:
			__el = _wait_for(driver, '#load_assuntos option:nth-child(2)')
			if not _last:
				break
			elif _to_bs(driver.page_source).select('#load_assuntos option')[1].get('value') != _last:
				break

		_last = _to_bs(driver.page_source).select('#load_assuntos option')[1].get('value')

		topics_els = _to_bs(driver.page_source).select('#load_assuntos option')
		for topic_el in topics_els:
			topic_value = topic_el.get('value')
			topic_text = topic_el.text
			if topic_value:
				topics.append({
					'id': topic_value,
					'name': topic_text
				})

		_log(' - Found %d topics for %s' % (len(topics), s['name']))

		s['topics'] = topics

	codecs.open('./data-2.json', 'w', encoding="UTF-8").write(json.dumps({
		'bancas': bancas,
		'subjects': subjects,
		'years': [
			2010,
			2011,
			2012,
			2013,
			2014,
			2015,
			2016,
			2017,
		],
		'levels': [
			{ 'id': 'superior' },
			{ 'id': 'medio' },
			{ 'id': 'fundamental' },
		]
	}, indent=4, ensure_ascii=False))

	# _log(' - - Getting subject %s' % s)
	# driver.get('https://www.estudegratis.com.br/questoes-de-concurso/materia/%s' % s)
	

def retrieve_questions(driver):
	file = codecs.open('./data-2.json', encoding="UTF-8")
	data = json.loads(file.read())
	file.close()

	subjects = data["subjects"]
	for s in subjects:
		page_index = 1
		while True:
			url = 'https://www.estudegratis.com.br/questoes-de-concurso/materia/%s/tipo/multipla-escolha/%d' % (s['id'], page_index)
			page_path = _pathify(url)
			cached_page = _get_cached(url)
			if cached_page:
				_log(" -- Restoring from cache: %s" % url)
				bs = _to_bs(cached_page)
				___bs = _to_bs(cached_page)
			else:
				_log(" -- Getting page: %s" % url)
				_success = False
				for __r in range(DEF_MAX_RENTRIES):
					try:
						driver.get(url)
						_success = True
						break
					except:
						_log('Connection error! trying again...')
						time.sleep(5)
				if not _success:
					_log('Max rentries reached! Skipping page %s' % id)
					continue

				bs = _to_bs(driver.page_source)
				_save_to_cache(url, driver.page_source)
				___bs = _to_bs(driver.page_source)
			
			questions = []
			questions_elements = bs.select('.questao-de-concurso')

			for q_el in questions_elements:
				id = q_el.get('id')

				_____cached = _get_cached(id, 'question_')
				if _____cached:
					_log(' -- Skipping question %s' % id)
					continue

				topic = q_el.select('.questao-cabecalho-separador span a')[1].get('href').replace(
					'https://www.estudegratis.com.br/questoes-de-concurso/materia/%s/assunto/' % s['id'], '')
				subject = s['id']

				try:
					year = _clear_text(q_el.select('.questao-cabecalho > a')[0].text)
				except:
					year = None

				try:
					banca = q_el.select('.questao-cabecalho > a')[1].get('href').replace(
						'https://www.estudegratis.com.br/questoes-de-concurso/materia/%s/banca/' % s['id'], '')
				except:
					banca = None

				try:
					concurso = q_el.select('.questao-cabecalho > a')[2].get('href').replace(
						'https://www.estudegratis.com.br/questoes-de-concurso/orgao/', '')
				except:
					concurso = None

				text_parts = [_clear_text(p.text) for p in q_el.select('.questao-enunciado > p')]

				try:
					answers_texts = [_clear_text(a.text) for a in q_el.select('.questao-alternativas li')]
					answers = []
					for at in answers_texts:
						__m = re.compile(r'^(\w)\.\s*(.*?)$').findall(at)
						answers.append({ 
							"v": __m[0][0],
							"t": __m[0][1]
						})


					response = driver.execute_async_script(
						"""
							var done = arguments[0];
							function post(yourUrl, data, callback) {
							    var xhr = new XMLHttpRequest();
							    xhr.onreadystatechange = function () {
							        if (this.readyState != 4) return;
									callback(this.responseText)
							    };
							    xhr.open("POST", yourUrl, true);
							    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
							    return xhr.send(data);
							}
							post(
								"https://www.estudegratis.com.br/exe/resolver", 
								"q_codquest=%s&q_resposta=Qw%%3D%%3D", 
								done
							)
						""" % id
					)

					correct_answer = 'C'
					
					message = json.loads(response)['mensagem']
					
					groups = re.compile(r'<b>(\w)<\/b>').findall(message)
					
					if len(groups) >= 1:
						correct_answer = groups[0]

					for a in answers:
						if a['v'] == correct_answer:
							a['c'] = 't'

					__q = {
						'i': id, 
						't': topic, 
						's': subject, 
						'y': year, 
						'b': banca, 
						'c': concurso, 
						'p': text_parts, 
						'a': answers
					}

					_log(' -- Saving question %s' % id)
					_save_to_cache(id, json.dumps(__q, ensure_ascii=False, indent=4), 'question_')
				except:
					_log(' -- Skipping question %s due to ERROR!!!' % id)
					continue

			if len(___bs.select('.pagination a[rel="next"]')) > 0:
				page_index += 1
				_log("Getting next page: %d" % page_index)
			else:
				_log(" -- No next page found for %s" % page_path)


driver = webdriver.Firefox()
sign_in(driver)
retrieve_questions(driver)

driver.close()
