
try {
  
  function initQaLabelDef() {

    qaLabelsDb = db.getSiblingDB("qa_labels");
    collection = qaLabelsDb.labels_def;

    let res = [
      collection.drop(),
      collection.createIndex({ 'label': 1 }),
      collection.insert({ "label": "Platinum", "exploratory": "OK", "unit_test_coverage": "=100", "sonar_issues": "0", "integration_coverage": "=100", "functional_ok": "=100", "performance": "=100", "bug_severity_amount": "0", "description": "El equipo de QA considera que el producto cumple sobradamente con la calidad para promocionar a entornos productivos" }), 
      collection.insert({ "label": "Gold", "exploratory": "OK", "unit_test_coverage": ">80", "sonar_issues": "0", "integration_coverage": ">90", "functional_ok": "=100", "performance": ">90", "bug_severity_amount": "<2", "description": "El equipo de QA considera que el producto cumple ampliamente con la calidad para promocionar a entornos productivos" }), 
      collection.insert({ "label": "Silver", "exploratory": "OK", "unit_test_coverage": ">70", "sonar_issues": "0", "integration_coverage": ">80", "functional_ok": "=100", "performance": ">80", "bug_severity_amount": "<4", "description": "El equipo de QA considera que el producto cumple la calidad minima para promocionar a entornos productivos" }), 
      collection.insert({ "label": "Bronze", "exploratory": "OK", "unit_test_coverage": ">50", "sonar_issues": "<9", "integration_coverage": ">50", "functional_ok": ">90", "performance": ">80", "bug_severity_amount": "<8", "description": "El equipo de QA considera que el producto cumple la calidad minima para promocionar entre entornos" }), 
      collection.insert({ "label": "Danger", "exploratory": "N/A", "unit_test_coverage": ">20", "sonar_issues": ">9", "integration_coverage": ">20", "functional_ok": ">50", "performance": "<80", "bug_severity_amount": "<32", "description": "La política de calidad del producto permite evaluar parcialemente la calidad de éste. El equipo de QA no recomienda promocionar entre entornos" }), 
      collection.insert({ "label": "Bomb", "exploratory": "N/A", "unit_test_coverage": "<20", "sonar_issues": ">40", "integration_coverage": "<20", "functional_ok": "<50", "performance": "<50", "bug_severity_amount": ">32", "description": "La política de calidad del producto permite evaluar parcialemente la calidad de éste. El equipo de QA no recomienda promocionar entre entornos" }), 
      collection.insert({ "label": "Unknown", "exploratory": "N/A", "unit_test_coverage": "?", "sonar_issues": "?", "integration_coverage": "?", "functional_ok": "?", "performance": "?", "bug_severity_amount": ">0", "description": "La política de calidad del producto no permite evaluar en ningun grado la calidad de éste. El equipo de QA desaconseja promocionar entre entornos" }), 
      collection.insert({ "label": "NA", "exploratory": "", "unit_test_coverage": "", "sonar_issues": "N/A", "integration_coverage": "", "functional_ok": "", "performance": "N/A", "bug_severity_amount": "", "description": "N/A" }), 
      collection.insert({ "label": "error", "exploratory": "", "unit_test_coverage": "", "sonar_issues": "", "integration_coverage": "", "functional_ok": "", "performance": "", "bug_severity_amount": "", "description": "Se ha producido un error interno al realizar las pruebas" }), 
    ];

    printjson(res);
  }
  
  initQaLabelDef();

} catch(error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);