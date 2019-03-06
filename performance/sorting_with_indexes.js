// switch to the m201 database
use m201

// find all documents and sort them by ssn
db.people.find({}, { _id : 0, last_name: 1, first_name: 1, ssn: 1 }).sort({ ssn: 1 })

// create an explainable object for the people collection
var exp = db.people.explain('executionStats')

// and rerun the query (uses the index for sorting)
exp.find({}, { _id : 0, last_name: 1, first_name: 1, ssn: 1 }).sort({ ssn: 1 })

// this time, sort by first_name (didn't use the index for sorting)
exp.find({}, { _id : 0, last_name: 1, first_name: 1, ssn: 1 }).sort({ first_name: 1 })

// and rerun the first query, but sort descending (walks the index backward)
exp.find({}, { _id : 0, last_name: 1, first_name: 1, ssn: 1 }).sort({ ssn: -1 })

// filtering and sorting in the same query (both using the index, backward)
exp.find( { ssn : /^555/ }, { _id : 0, last_name: 1, first_name: 1, ssn: 1 } ).sort( { ssn : -1 } )

// drop all indexes
db.people.dropIndexes()

// create a new descending (instead of ascending) index on ssn
db.people.createIndex({ "address.state": 1, "last_name": 1, "job": 1 })

// rerun the same query, now walking the index forward
exp.find( { ssn : /^555/ }, { _id : 0, last_name: 1, first_name: 1, ssn: 1 } ).sort( { ssn : -1 } )



Queries:
exp.find({"address.state": "Nebraska", "last_name": /^G/, "job": "Police officer"})
exp.find({"job": /^P/, "first_name": /^C/, "address.state": "Indiana"}).sort({ "last_name": 1 })
exp.find({"address.state": "Connecticut", "birthday": {"$gte": ISODate("2010-01-01T00:00:00.000Z"),"$lt": ISODate("2011-01-01T00:00:00.000Z")}})



1)
db.people.createIndex({ "address.state": 1, "last_name": 1, "job": 1 })

Yes, this is the best index. This index matches the first query, can be used for sorting on the second, and has an prefix for the 3rd query.

		"executionSuccess" : true,
		"nReturned" : 2,
		"executionTimeMillis" : 1,
		"totalKeysExamined" : 31,
		"totalDocsExamined" : 2,

		"executionSuccess" : true,
		"nReturned" : 8,
		"executionTimeMillis" : 3,
		"totalKeysExamined" : 488,
		"totalDocsExamined" : 67,

	        "executionSuccess" : true,
		"nReturned" : 0,
		"executionTimeMillis" : 0,
		"totalKeysExamined" : 0,
		"totalDocsExamined" : 0,


2)
db.people.createIndex({ "job": 1, "address.state": 1, "first_name": 1 })

No, while this index is better than the one directly above it, this index still cannot be used by the 3rd query at all.

		"executionSuccess" : true,
		"nReturned" : 2,
		"executionTimeMillis" : 1,
		"totalKeysExamined" : 3,
		"totalDocsExamined" : 3,

		"executionSuccess" : true,
		"nReturned" : 8,
		"executionTimeMillis" : 3,
		"totalKeysExamined" : 183,
		"totalDocsExamined" : 8,

		"executionSuccess" : true,
		"nReturned" : 96,
		"executionTimeMillis" : 62,
		"totalKeysExamined" : 0,
		"totalDocsExamined" : 50474,

3)
db.people.createIndex({ "job": 1, "address.state": 1, "last_name": 1 })

No, this index has the same issues as the index directly above it.

		"executionSuccess" : true,
		"nReturned" : 2,
		"executionTimeMillis" : 0,
		"totalKeysExamined" : 4,
		"totalDocsExamined" : 2,

		"executionSuccess" : true,
		"nReturned" : 8,
		"executionTimeMillis" : 2,
		"totalKeysExamined" : 204,
		"totalDocsExamined" : 67,

		"executionSuccess" : true,
		"nReturned" : 96,
		"executionTimeMillis" : 38,
		"totalKeysExamined" : 0,
		"totalDocsExamined" : 50474,

4)
db.people.createIndex({ "address.state": 1, "job": 1, "first_name": 1 })

No, this index is better than the first, but it still doesn't help with the sort on the second query.

		"executionSuccess" : true,
		"nReturned" : 2,
		"executionTimeMillis" : 1,
		"totalKeysExamined" : 3,
		"totalDocsExamined" : 3,

		"executionSuccess" : true,
		"nReturned" : 8,
		"executionTimeMillis" : 1,
		"totalKeysExamined" : 59,
		"totalDocsExamined" : 8,

		"executionSuccess" : true,
		"nReturned" : 96,
		"executionTimeMillis" : 5,
		"totalKeysExamined" : 716,
		"totalDocsExamined" : 716,

5)
db.people.createIndex({ "job": 1, "address.state": 1 })

No, this index can only be used by the first two queries.

		"executionSuccess" : true,
		"nReturned" : 2,
		"executionTimeMillis" : 0,
		"totalKeysExamined" : 3,
		"totalDocsExamined" : 3,

		"executionSuccess" : true,
		"nReturned" : 8,
		"executionTimeMillis" : 2,
		"totalKeysExamined" : 204,
		"totalDocsExamined" : 67,

		"executionSuccess" : true,
		"nReturned" : 96,
		"executionTimeMillis" : 60,
		"totalKeysExamined" : 0,
		"totalDocsExamined" : 50474,

6)
db.people.createIndex({ "address.state": 1, "job": 1 })

No, while this index would be able to service all 3 of the example queries, there's a better index that can be used on the first query, and the second query has to do an in-memory sort.

		"executionSuccess" : true,
		"nReturned" : 2,
		"executionTimeMillis" : 1,
		"totalKeysExamined" : 3,
		"totalDocsExamined" : 3,

		"executionSuccess" : true,
		"nReturned" : 8,
		"executionTimeMillis" : 1,
		"totalKeysExamined" : 69,
		"totalDocsExamined" : 67,

		"executionSuccess" : true,
		"nReturned" : 96,
		"executionTimeMillis" : 5,
		"totalKeysExamined" : 716,
		"totalDocsExamined" : 716,


