import re
import os
from collections import defaultdict

def parse_file(filepath, round_name):
    """
    Parses a tournament round file and returns stats for each player.
    """
    if not os.path.exists(filepath):
        return {}
        
    player_data = defaultdict(lambda: {'score': 0, 'opp_score': 0, 'win': 0, 'log': []})
    tables = []
    current_table = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        table_num = 0
        for line in f:
            if '[ MASA' in line:
                table_match = re.search(r'(\d+)', line)
                table_num = int(table_match.group(1)) if table_match else 0
                if current_table:
                    tables.append(current_table)
                current_table = []
            elif ':' in line and '[' in line and ']' in line:
                name = line.split(']')[1].split(':')[0].strip()
                score_text = line.split(':')[1].strip()
                score_match = re.search(r'(\d+)', score_text)
                
                if score_match:
                    score = int(score_match.group(1))
                    is_out = '(Çıktı)' in line or '(çıktı)' in line.lower()
                    current_table.append({'name': name, 'score': score, 'table': table_num, 'is_out': is_out})
        if current_table:
            tables.append(current_table)
            
    for table in tables:
        if not table: continue
        table_sum = sum(p['score'] for p in table)
        
        for p in table:
            if p['is_out']: continue
            
            rank = 1
            for other in table:
                if other['score'] > p['score']:
                    rank += 1
            
            name = p['name']
            player_data[name]['score'] += p['score']
            player_data[name]['opp_score'] += (table_sum - p['score'])
            if rank == 1:
                player_data[name]['win'] += 1
            # Add Table Total (TP) to log
            player_data[name]['log'].append('%s(T%d: %d, %d., TP: %d)' % (round_name, p['table'], p['score'], rank, table_sum))
            
    return player_data

def update_standings():
    # Base paths
    base_path = 'c:/Users/Lenovo/Desktop/everything/frontend/app/apps/tournament-editor/tournament'
    t1_path = os.path.join(base_path, '1.tur.txt')
    t2_path = os.path.join(base_path, '2.tur.txt')
    output_path = os.path.join(base_path, 'lig_guncelleme.txt')

    # Parse Round 1 and Round 2
    round1 = parse_file(t1_path, 'M1')
    round2 = parse_file(t2_path, 'M2')

    all_names = set(list(round1.keys()) + list(round2.keys()))
    final_stats = []

    for name in all_names:
        r1 = round1.get(name, {'score': 0, 'opp_score': 0, 'win': 0, 'log': []})
        r2 = round2.get(name, {'score': 0, 'opp_score': 0, 'win': 0, 'log': []})
        
        total_score = r1['score'] + r2['score']
        total_avg = r1['opp_score'] + r2['opp_score']
        total_wins = r1['win'] + r2['win']
        full_log = ', '.join(r1['log'] + r2['log'])
        
        final_stats.append({
            'name': name,
            'score': total_score,
            'avg': total_avg,
            'wins': total_wins,
            'log': full_log
        })

    # Sort by total score desc, then total wins desc, then total average desc
    final_stats.sort(key=lambda x: (x['score'], x['wins'], x['avg']), reverse=True)

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        # Header
        f.write('{:<3} | {:<30} | {:<1} | {:<4} | {:<20}\n'.format('#', 'Oyuncu', 'G', 'Puan', 'Log'))
        f.write('-' * 120 + '\n')
        
        for i, p in enumerate(final_stats, 1):
            f.write('{:<3} | {:<30} | {:<1} | {:<4} | {:<20}\n'.format(
                i, p['name'], p['wins'], p['score'], p['log']
            ))
    print(f"Standings updated successfully in: {output_path}")

if __name__ == "__main__":
    update_standings()
