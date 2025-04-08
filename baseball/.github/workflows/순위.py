import requests
from bs4 import BeautifulSoup
import json
import time
import sys
from datetime import datetime

def fetch_kbo_rankings():
    """KBO 순위 정보를 가져와서 JSON 형식으로 반환"""
    try:
        # 네이버 스포츠에서 데이터 가져오기
        url = "https://sports.news.naver.com/kbaseball/record/index?category=kbo"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 순위 테이블 찾기
        table = soup.find("div", class_="tb")
        if not table:
            table = soup.find("table")
        
        rankings = []
        
        if table:
            rows = table.find_all("tr")[1:]  # 헤더 제외
            prev_win_rate = None
            rank = 1
            display_rank = 1
            
            for row in rows:
                cols = row.find_all("td")
                if len(cols) >= 7:
                    team = cols[0].text.strip()  # 팀명
                    games = cols[1].text.strip()  # 경기수
                    win = cols[2].text.strip()  # 승
                    lose = cols[3].text.strip()  # 패
                    draw = cols[4].text.strip()  # 무
                    win_rate = float(cols[5].text.strip())  # 승률
                    games_behind = cols[6].text.strip()  # 게임차
                    
                    # 공동 순위 처리
                    if prev_win_rate is not None and prev_win_rate == win_rate:
                        rank_text = display_rank  # 이전 순위 유지
                    else:
                        rank_text = rank
                        display_rank = rank
                    
                    # JSON 데이터 형식으로 저장
                    team_data = {
                        "rank": rank_text,
                        "team": team,
                        "games": games,
                        "win": win,
                        "lose": lose,
                        "draw": draw,
                        "win_rate": round(win_rate, 3),
                        "games_behind": games_behind
                    }
                    
                    rankings.append(team_data)
                    
                    prev_win_rate = win_rate
                    rank += 1
        
        # 최종 JSON 데이터
        result = {
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "rankings": rankings
        }
        
        return result
    
    except Exception as e:
        print(f"데이터를 가져오는 중 오류가 발생했습니다: {str(e)}")
        return None

def save_rankings_to_json(data, filename="rank.json"):
    """순위 데이터를 JSON 파일로 저장"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"순위 데이터가 {filename}에 저장되었습니다.")
        print(f"마지막 업데이트: {data['last_updated']}")
    except Exception as e:
        print(f"파일 저장 중 오류가 발생했습니다: {str(e)}")

def main():
    try:
        # KBO 순위 데이터 가져오기
        rankings_data = fetch_kbo_rankings()
        
        if rankings_data:
            # JSON 파일로 저장
            save_rankings_to_json(rankings_data)
        else:
            print("순위 데이터를 가져오지 못했습니다.")
            sys.exit(1)
            
    except Exception as e:
        print(f"프로그램 실행 중 오류가 발생했습니다: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()