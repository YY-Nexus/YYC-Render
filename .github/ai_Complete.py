import sys
import requests

def get_ai_suggestion(report_file, api_url="http://localhost:8000/generate"):
    with open(report_file, "r") as f:
        content = f.read()
    payload = {"prompt": f"请补全并优化如下代码问题：\n{content}", "max_tokens": 256}
    resp = requests.post(api_url, json=payload)
    result = resp.json().get("result", "")
    return result

lint_suggest = get_ai_suggestion(sys.argv[1])
format_suggest = get_ai_suggestion(sys.argv[2])

with open('.github/ai_comment.md', 'w') as f:
    f.write("### AI代码审核与补全建议\n")
    f.write("**Lint分析建议：**\n")
    f.write(lint_suggest + "\n\n")
    f.write("**格式化分析与补全：**\n")
    f.write(format_suggest)
