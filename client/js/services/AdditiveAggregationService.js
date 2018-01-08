app.service('AdditiveAggregationService', function() {


  this.getResults = function(criteria, options) {
   var results = [];
   var ranking = [];
   var i,j,k;

   for(i=0; i<options.length; i++) {
      results=0;
        for(j=0; j<criteria.length; j++) {
            results+=criteria[j].weight * options[i][criteria[j].name];
        }
        ranking[i] = {name: options[i].name, score: results};
   }
   ranking.sort(compareOptions);
   return ranking;
   }

   function compareOptions(a, b) {
       if(a['score']>b['score'])
           return -1;
       else
           return 1;
   }


});
