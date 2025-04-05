from bs4 import BeautifulSoup, PageElement
from requests import request
import json


areas = {
  "nav": {
    "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Navigation/Navigation-node.html"
  },
  "legal": {
    "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Schifffahrtsrecht/Schifffahrtsrecht-node.html"
  },
  "weather": {
    "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Wetterkunde/Wetterkunde-node.html"
  },
  "crew_1": {
    "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Seemannschaft-I/Seemannschaft-I-node.html"
  },
  "crew_2": {
    "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-SKS/Seemannschaft-II/Seemannschaft-II-node.html"
  }
}

def parse_page(doc: BeautifulSoup):
  content_node = doc.find('div', { 'id': 'content' })
  # strip some nodes
  for (tag, attrs) in [
    ('h1', { 'class': 'isFirstInSlot' }),
    ('div', { 'class': 'sectionRelated' }),
    ('div', { 'class': 'dateOfIssue' }),
  ]:
    for node in content_node.find_all(tag, attrs=attrs):
      node.decompose()

  tasks = []
  current_chunk_nr = ""
  current_chunk_question: list[PageElement] = []
  current_chunk_answer: list[PageElement] = []
  active_section = "nr"

  def make_task(nr: str, question_parts: list[PageElement], answer_parts: list[PageElement]):
    return {
      "nr": nr.replace("Nummer", "").strip("\n :"),
      "question": "".join([str(tag) for tag in question_parts]),
      "answer": "".join([str(tag) for tag in answer_parts]),
    }

  for node in content_node.children:
    if isinstance(node, str):
      continue

    name = node.name
    classes = node.get('class') or []

    # end chunk
    if name == "p" and 'line' in classes:
      tasks.append(make_task(current_chunk_nr, current_chunk_question, current_chunk_answer))
      current_chunk_nr = ""
      current_chunk_question = []
      current_chunk_answer = []
      active_section = "nr"
      continue

    if active_section == "nr":
      current_chunk_nr = node.get_text()
      active_section = "question"
    elif active_section == "question":
      # text in question
      if (name == "p" or name == "strong") and 'picture' not in classes and node.find('strong'):
        current_chunk_question.append(node)
      # is picture in question
      elif name == "p" 'picture' in classes:
        current_chunk_question.append(node)
      elif name == "p" and node.get_text().strip() == "":
        active_section = "answer"
      else:
        # begin answer block
        active_section = "answer"
        current_chunk_answer.append(node)
    # add all left over answer nodes
    elif active_section == "answer":
      current_chunk_answer.append(node)

  tasks.append(make_task(current_chunk_nr, current_chunk_question, current_chunk_answer))

  return tasks

for area_name in areas:
  area = areas[area_name]
  response = request("get", area["url"])
  if not response.ok:
    print(f"request failed to {area['url']}")
  else:
    doc = BeautifulSoup(response.text)
    area["tasks"] = parse_page(doc)

with open("./questions.json", "w") as f:
  json.dump(areas, f)