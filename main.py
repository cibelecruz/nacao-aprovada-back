import pymongo
import datetime
import random

# Connect to MongoDB
client = pymongo.MongoClient('adicione aqui a url de conexao com o banco')

# Get collection users from database test
db = client["test"]
users = db["users"]

# Get collection tasks from database test
tasks = db["tasks"]

# Get collection taskNotes from database test
task_notes = db["taskNotes"]

# Get collection userSubjectsStatus
user_subject_status = db["userSubjectsStatus"]

# Get collection courses
courses = db["courses"]

# Get collection subjects
subjects = db["subjects"]

# Get user by id, remove course by id, remove all users tasks, remove all task notes related to those tasks and remove userSubjectStatus
def resetUserById(id):
    user = collection
    user = users.find_one({"_id": id})
    if user is None:
        return False
    
    # users.delete_one({"_id": id})
    user_tasks = tasks.find({"userId": id})
    for task in tasks:
        collection = db["taskNotes"]
        taskNotes = collection
        taskNotes = taskNotes.find({"taskId": task["_id"]})
        for taskNote in taskNotes:
            collection.delete_one({"_id": taskNote["_id"]})
        collection = db["tasks"]
        collection.delete_one({"_id": task["_id"]})
    collection = db["userSubjectsStatus"]
    collection.delete_one({"userId": id})
    return True

# Get user collection and delete all users
def resetUsers():
    collection = db["users"]
    collection.delete_many({})
    return True

# Get task collection and delete all tasks
def resetTasks():
    collection = db["tasks"]
    collection.delete_many({})
    return True

# Get taskNotes collection and delete all taskNotes
def resetTaskNotes():
    collection = db["taskNotes"]
    collection.delete_many({})
    return True

def resetUserSubjectStatus():
    collection = db["userSubjectsStatus"]
    collection.delete_many({})
    return True

# call reset functions
def resetUser():
    resetUsers()
    resetTasks()
    resetTaskNotes()
    resetUserSubjectStatus()

#-----------------------------------
# migrate user courses to have expiration and registration date
def migrateUserCoursesForExpirationAndRegistrationDates():
    user_docs = users.find({})
    for user_doc in user_docs:
        courses = user_doc.get("courses", [])
        updated_courses = []
        for course in courses:
            registrationDate = datetime.datetime.now() - datetime.timedelta(days=random.randint(1, 180))
            course = {
                "id": course["id"],
                "registrationDate": registrationDate.strftime('%Y-%m-%d'),
                "expirationDate": (registrationDate + datetime.timedelta(days=365)).strftime('%Y-%m-%d')
            }
            updated_courses.append(course)
        users.update_one({"_id": user_doc["_id"]}, {"$set": {"courses": updated_courses}})
    return True

#-----------------------------------
# migrate subjects to new collection
def migrateSubjects():
    course_doc = courses.find_one({"_id": "4ad3db6f-5e0e-48e2-81ae-77997aaceb7f"})
    subjects_array = course_doc.get("subjects", [])
    subjects_to_add = []
    for subject in subjects_array:
        subjects_to_add.append({
            "_id": subject["_id"],
            "name": subject["name"],
            "topics": list(map(lambda x: {
                "name": x["name"],
                "id": x["_id"],
                "active": True,
                "taskTypes": ["study", "lawStudy", "exercise", "review"]
            }, subject["topics"])),
            "createdAt": datetime.datetime.now(),
            "updatedAt": datetime.datetime.now()
        })
    subjects.insert_many(subjects_to_add)
    return True

#------------------------------------
# migrate courses to have active and relevance for subjects and for topics
def migrateCoursesForActiveAndRelevance():
    course_doc = courses.find_one({"_id": "4ad3db6f-5e0e-48e2-81ae-77997aaceb7f"})
    subjects_array = course_doc.get("subjects", [])
    updated_subjects = []
    for subject in subjects_array:
            topics_array = subject.get("topics", [])
            updated_topics = []
            for topic in topics_array:
                updated_topics.append({
                    "id": topic["_id"],
                    "active": True,
                    "relevance": topic["relevance"],
                    "taskTypes": ["study", "lawStudy", "exercise", "review"]
                })
            updated_subjects.append({
                "id": subject["_id"],
                "relevance": subject["relevance"],
                "topics": updated_topics,
                "active": True
            })
    courses.update_one({"_id": course_doc["_id"]}, {"$set": {"subjects": updated_subjects}})

#-----------------------------------
# migrate user courses
def migrateUserSubjectStatusForCustomizations():
    user_course_doc = user_subject_status.find({"courseId": "4ad3db6f-5e0e-48e2-81ae-77997aaceb7f"})
    for user_course in user_course_doc:
        user_subject_status.update_one({"_id": user_course["_id"]}, {"$set": {"hitsAndMisses": [], "customizations": []}, "$unset": {"subjects": "", "subjectCustomizations": ""}})
migrateUserSubjectStatusForCustomizations()
'''
course:{
    subjects: [
    {id: "1", relevance: 0.5, topics: [{id: "1", relevance: 0.5, active: True, taskTypes: ["study", "lawStudy", "exercise", "review"]}, {id: "2", relevance: 0.5, taskTypes: ["study", "lawStudy", "exercise", "review"]}], active: true},
    {id: "2", relevance: 0.5, topics: [{id: "1", relevance: 0.5, active: True, taskTypes: ["study", "lawStudy", "exercise", "review"]}, {id: "2", relevance: 0.5, taskTypes: ["study", "lawStudy", "exercise", "review"]}], active: true},
    {id: "3", relevance: 0.5, topics: [{id: "1", relevance: 0.5, active: True, taskTypes: ["study", "lawStudy", "exercise", "review"]}, {id: "2", relevance: 0.5, taskTypes: ["study", "lawStudy", "exercise", "review"]}], active: true},
    ]
}

user_course: {
    hitsAndMisses: [
    {id: "1", topics: [{id: "1", correct: 10, wrong: 5}, {id: "2", correct: 10, wrong: 5}]}
    ],
    customizations: [
      {subjectId: "1", active: false},
      {subjectId: "2", topicCustomizations: [{topicId: "2", active: false}]}
    ]
}

tratar subjects contendo apenas hits e misses de um topic e ir adicionando a medida que for necessário. o mesmo para customizations
'''
