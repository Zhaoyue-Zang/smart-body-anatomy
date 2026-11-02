"""Optional Flask adapter for the 智触人体 educational website.

The static HTML works without this server. This file adds provider-backed
language/vision inference when the deployer explicitly configures API keys.
No API keys are ever embedded in browser code.

This is a minimal development/deployment integration, not a hardened
institutional identity, RBAC, audit or medical-device platform.
"""
from __future__ import annotations

import base64
import binascii
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path

import requests
from flask import Flask, jsonify, request, send_from_directory
from dotenv import load_dotenv

load_dotenv(Path(__file__).with_name('.env'))
APP_DIR=Path(__file__).resolve().parent
app=Flask(__name__,static_folder=None)
app.config['MAX_CONTENT_LENGTH']=8*1024*1024

CHAT_KEY=os.getenv('AI_API_KEY','').strip()
CHAT_BASE=os.getenv('AI_API_BASE','https://api.deepseek.com/v1').strip().rstrip('/')
CHAT_MODEL=os.getenv('AI_MODEL','deepseek-chat').strip()
VISION_KEY=os.getenv('VISION_API_KEY','').strip()
VISION_BASE=os.getenv('VISION_API_BASE','').strip().rstrip('/')
VISION_MODEL=os.getenv('VISION_MODEL','').strip()
PER_MINUTE=max(1,min(60,int(os.getenv('AI_RATE_LIMIT_PER_MINUTE','12'))))
LLM_TIMEOUT=max(8,min(120,int(os.getenv('AI_TIMEOUT_SECONDS','45'))))

# Single-process safety limit only; use an authenticated gateway and distributed
# rate limiting before exposing fee-bearing endpoints on the public internet.
_request_times=defaultdict(deque)

def error(message,code):
    return jsonify({'error':message}),code

@app.after_request
def safe_headers(resp):
    resp.headers['X-Content-Type-Options']='nosniff'
    resp.headers['X-Frame-Options']='DENY'
    resp.headers['Referrer-Policy']='no-referrer'
    resp.headers['Permissions-Policy']='geolocation=(), camera=(), microphone=(self)'
    if request.path.startswith('/api/'):
        resp.headers['Cache-Control']='no-store, private'
    return resp

@app.errorhandler(413)
def file_too_large(_):
    return error('上传内容超过 8 MB 上限。',413)

@app.get('/')
def index():
    return send_from_directory(APP_DIR,'index.html')

@app.get('/<path:filename>')
def static_files(filename):
    # Flask's send_from_directory uses safe_join; only allow delivered web assets.
    if filename in ('app.js','index.html','studio.html','studio.css','studio.js','experience.css','experience.js','learning-tools.js') or filename.startswith('assets/'):
        return send_from_directory(APP_DIR,filename)
    return error('Not found',404)

@app.get('/api/health')
def health():
    return jsonify({'status':'ok','chat_ready':bool(CHAT_KEY and CHAT_MODEL),'vision_ready':bool(VISION_KEY and VISION_BASE and VISION_MODEL),'mode':'server'})

def rate_limit():
    key=request.remote_addr or 'unknown'
    q=_request_times[key]
    now=time.monotonic()
    while q and now-q[0]>60:
        q.popleft()
    if len(q)>=PER_MINUTE:
        return False
    q.append(now)
    # Avoid unbounded growth from discarded addresses in long-running server.
    if len(_request_times)>20000:
        _request_times.clear()
    return True

def read_payload():
    if not request.is_json:
        return None,error('请求必须为 JSON 格式。',415)
    data=request.get_json(silent=True)
    if not isinstance(data,dict):
        return None,error('请求数据格式错误。',400)
    mode=data.get('mode','professional')
    if mode not in ('professional','popular'):
        return None,error('回答模式不受支持。',400)
    q=data.get('question','')
    if not isinstance(q,str) or not q.strip() or len(q)>1000:
        return None,error('问题长度必须在1至1000字符之间。',400)
    return {'question':q.strip(),'mode':mode},None

SYSTEM_PROMPT=(
    '你是“智触人体·医脉相承”平台的基础人体解剖学教学助教。'
    '你的回答仅用于医学教育，不用于个体诊断、开具处方、指导危险侵入性操作。'
    '使用标准中文人体解剖术语，必要时附拉丁或英文名。'
    '结构性回答尽量说明名称、位置、毗邻关系、功能、典型临床联系。'
    '若用户上传的图像辨识度不足或不能确定结构，必须明确表示不确定，不能臆测。'
    '不能假装已浏览不存在的标本或查阅不可访问的资料。'
)

def call_provider(api_base,api_key,model,messages):
    if not api_base.startswith('https://') and not api_base.startswith('http://127.0.0.1'):
        raise ValueError('API_BASE 必须使用 HTTPS，或在本机使用 127.0.0.1 地址。')
    r=requests.post(
       api_base+'/chat/completions',
       headers={'Authorization':'Bearer '+api_key,'Content-Type':'application/json'},
       json={'model':model,'messages':messages,'temperature':.25,'max_tokens':1100},
       timeout=LLM_TIMEOUT,
    )
    r.raise_for_status()
    payload=r.json()
    answer=payload.get('choices',[{}])[0].get('message',{}).get('content','')
    if isinstance(answer,list):
        answer='\n'.join(x.get('text','') for x in answer if isinstance(x,dict))
    if not isinstance(answer,str) or not answer.strip():
        raise ValueError('模型未返回可识别的文本。')
    return answer.strip()[:9000]

def mode_prompt(mode):
    if mode=='popular':
        return '回答采用简明易懂的表述和直观比喻，但不得牺牲解剖准确性；首次出现专业名词时解释其含义。'
    return '回答面向临床医学本科生，使用准确解剖术语，条理清晰，适当解释临床意义。'

@app.post('/api/ai/chat')
def chat():
    if not CHAT_KEY:return error('尚未配置 AI 语言模型。',503)
    if not rate_limit():return error('请求过于频繁，请稍后再试。',429)
    data,err=read_payload()
    if err:return err
    messages=[{'role':'system','content':SYSTEM_PROMPT+' '+mode_prompt(data['mode'])},
              {'role':'user','content':data['question']}]
    try:
        answer=call_provider(CHAT_BASE,CHAT_KEY,CHAT_MODEL,messages)
        return jsonify({'answer':answer,'source':'configured-model'})
    except requests.Timeout:
        return error('模型服务请求超时。',504)
    except (requests.RequestException,ValueError,KeyError,IndexError) as exc:
        app.logger.warning('AI provider failure: %s',type(exc).__name__)
        return error('模型服务暂不可用，请检查模型配置或网络连接。',502)

@app.post('/api/ai/vision')
def vision():
    if not(VISION_KEY and VISION_BASE and VISION_MODEL):
        return error('尚未配置支持图像输入的视觉模型。',503)
    if not rate_limit():return error('请求过于频繁，请稍后再试。',429)
    data,err=read_payload()
    if err:return err
    body=request.get_json()
    uri=body.get('image')
    if not isinstance(uri,str):return error('缺少图像文件。',400)
    match=re.fullmatch(r'data:(image/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)',uri)
    if not match:return error('仅支持 JPEG、PNG、WEBP 的 base64 数据。',400)
    try:
        raw=base64.b64decode(match.group(2),validate=True)
    except (binascii.Error,ValueError):
        return error('图像编码错误。',400)
    if len(raw)>5*1024*1024:return error('图片不能超过5 MB。',413)
    mimetype=match.group(1)
    verified=((mimetype=='image/jpeg' and raw.startswith(b'\xff\xd8\xff')) or
              (mimetype=='image/png' and raw.startswith(b'\x89PNG\r\n\x1a\n')) or
              (mimetype=='image/webp' and len(raw)>12 and raw[:4]==b'RIFF' and raw[8:12]==b'WEBP'))
    if not verified:return error('上传图像内容与文件类型不一致。',400)
    messages=[{'role':'system','content':SYSTEM_PROMPT+' '+mode_prompt(data['mode'])+' 注意：图像仅用于教学识别，不能用于临床诊断。'},
              {'role':'user','content':[{'type':'text','text':data['question']},
                                       {'type':'image_url','image_url':{'url':uri}}]}]
    try:
        answer=call_provider(VISION_BASE,VISION_KEY,VISION_MODEL,messages)
        return jsonify({'answer':answer,'source':'configured-vision-model'})
    except requests.Timeout:
        return error('图像模型请求超时。',504)
    except (requests.RequestException,ValueError,KeyError,IndexError):
        return error('图像模型暂不可用，请检查模型与图像接口的兼容性。',502)

if __name__=='__main__':
    host=os.getenv('BIND_HOST','127.0.0.1')
    port=int(os.getenv('PORT','8000'))
    app.run(host=host,port=port,debug=False)
