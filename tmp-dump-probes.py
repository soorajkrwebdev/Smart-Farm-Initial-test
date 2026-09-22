import json

for fname in ['tmp-probe-result4.json', 'tmp-probe-result5.json']:
    d = json.load(open(fname))
    print('=' * 100)
    print('FILE:', fname)
    print('=' * 100)
    for r in d['results']:
        print('---', r['label'])
        print('    query:', r.get('query'))
        s = r.get('summary', {})
        print('    status:', s.get('status'), '| http:', r.get('httpStatus'),
              '| count:', s.get('count'), '| total:', s.get('total'))
        print('    distinct:', json.dumps(s.get('distinct'), indent=2)[:3000])
        for rec in (s.get('sample') or [])[:6]:
            print('    REC:', rec.get('State'), '|', rec.get('District'), '|',
                  rec.get('Market'), '|', rec.get('Commodity'), '|',
                  rec.get('Variety'), '|', rec.get('Grade'), '|',
                  rec.get('Arrival_Date'), '|', rec.get('Min_Price'),
                  rec.get('Max_Price'), rec.get('Modal_Price'))
        if r.get('error'):
            print('    ERROR:', str(r['error'])[:500])
    print()
