from pymongo import MongoClient
import os

client = MongoClient('mongodb://localhost:27017')
print("Databases:", client.list_database_names())
db = client['hr_intelligence_portal']

for collection_name in db.list_collection_names():
    count = db[collection_name].count_documents({})
    print(f"Collection: {collection_name} ({count} docs)")
    for doc in db[collection_name].find().limit(1):
        # Convert ObjectId to string for printing
        doc['_id'] = str(doc['_id'])
        print(doc.keys())
    print("-" * 30)
