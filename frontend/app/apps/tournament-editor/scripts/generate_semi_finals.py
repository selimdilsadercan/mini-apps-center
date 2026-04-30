import os

def generate_semi_finals():
    filepath = 'c:/Users/Lenovo/Desktop/everything/frontend/app/apps/tournament-editor/tournament/lig_guncelleme.txt'
    output_path = 'c:/Users/Lenovo/Desktop/everything/frontend/app/apps/tournament-editor/tournament/yari_final.txt'
    
    if not os.path.exists(filepath):
        print("Lig dosyası bulunamadı!")
        return

    players = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            if '|' in line and not line.startswith('#'):
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 2:
                    players.append(parts[1])

    # Top 16 players
    top_16 = players[:16]
    
    # Groups (Seeds)
    g1 = top_16[0:4]   # 1, 2, 3, 4
    g2 = top_16[4:8]   # 5, 6, 7, 8
    g3 = top_16[8:12]  # 9, 10, 11, 12
    g4 = top_16[12:16] # 13, 14, 15, 16

    # Mixing logic based on user request:
    # Table 1: 1. of G1, 2. of G2, 3. of G3, 4. of G4 -> [1, 6, 11, 16]
    # Table 2: 2. of G1, 1. of G2, 4. of G3, 3. of G4 -> [2, 5, 12, 15]
    # Table 3: 3. of G1, 4. of G2, 1. of G3, 2. of G4 -> [3, 8, 9, 14]
    # Table 4: 4. of G1, 3. of G2, 2. of G3, 1. of G4 -> [4, 7, 10, 13]
    
    tables = [
        [g1[0], g2[1], g3[2], g4[3]],
        [g1[1], g2[0], g3[3], g4[2]],
        [g1[2], g2[3], g3[0], g4[1]],
        [g1[3], g2[2], g3[1], g4[0]]
    ]

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("==================================================\n")
        f.write("            YARI FİNAL EŞLEŞMELERİ\n")
        f.write("==================================================\n\n")
        
        for i, table in enumerate(tables, 1):
            f.write(f"[ MASA {i} ]\n")
            for player in table:
                f.write(f"[  ] {player:<25} : ...... Puan\n")
            f.write("-" * 50 + "\n\n")
            
    print(f"Yarı final eşleşmeleri oluşturuldu: {output_path}")

if __name__ == "__main__":
    generate_semi_finals()
