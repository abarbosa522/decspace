app.service('IntegratedSRFService', function() {

  this.integrated_criteria = [];

  this.addCriteria = function(criteria) {
    for(criterion in criteria)
      criteria[criterion]['position'] = -1;

    this.integrated_criteria = criteria;
  }

  this.integrated_categories = [];

  this.addCategories = function(categories) {
    this.integrated_categories = categories;
  }

  this.integrated_category = '';
  
  this.integrated_results = [];
});
