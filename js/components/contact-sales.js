document.addEventListener('DOMContentLoaded', function() {
  // URL-Parameter abrufen
  const urlParams = new URLSearchParams(window.location.search);
  
  // Parameter-Mapping: URL-Parameter zu Formularfeld-Namen
  const paramMapping = {
    'form': null, // Spezialfall für die Checkbox
    'fname': 'firstname',
    'lname': 'lastname',
    'email': 'email',
    'company': 'company'
  };
  
  // Verschiedene Texte je nach Parameter-Wert
  const formTexts = {
    'ai-toolkit': {
      heading: 'Make your AI <strong class="headline-decoration">edit documents</strong>',
      text: 'With over 20,000 businesses using Tiptap, you\'re in good company.',
      selectToolkitInput: true
    },
    'collaboration': {
      heading: 'Ready to use <strong class="headline-decoration">Collaboration in Tiptap? </strong>',
      text: 'With over 20,000 businesses using Tiptap, you\'re in good company.',
      selectToolkitInput: false
    },
    'enterprise': {
      heading: 'Ready to go <strong class="headline-decoration">Enterprise with Tiptap? </strong>',
      text: 'With over 20,000 businesses using Tiptap, you\'re in good company.',
      selectToolkitInput: false
    },
    'editor': {
      heading: 'Build your <strong class="headline-decoration">custom editor with Tiptap? </strong>',
      text: 'With over 20,000 businesses using Tiptap, you\'re in good company.',
      selectToolkitInput: false
    },
    'use-case-legal': {
      heading: 'Let\'s build your <strong class="headline-decoration">legal editing experience</strong>',
      text: 'From import to redline to export… we\'ll help you get there!',
      selectToolkitInput: false
    }
    // Weitere Parameter-Werte hier hinzufügen
  };
  
  // AI Toolkit Checkbox Element finden
  const toolkitCheckboxContainer = document.querySelector('#interest-ai-toolkit')?.closest('.field-wrap');
  
  // Standardmäßig ausblenden, wenn kein Parameter übergeben wurde
  const formParam = urlParams.get('form');
  if (!formParam && toolkitCheckboxContainer) {
    toolkitCheckboxContainer.style.display = 'none';
  }
  
  // Durchlaufe alle definierten Parameter
  for (const [urlParam, fieldName] of Object.entries(paramMapping)) {
    const paramValue = urlParams.get(urlParam);
    
    // Wenn der Parameter existiert und einen Wert hat
    if (paramValue) {
      // Spezialfall für 'form' Parameter (Checkbox, Heading-Text und Intro-Text)
      if (urlParam === 'form') {
        // Checkbox ankreuzen, wenn es die entsprechende gibt
        const checkbox = document.getElementById(`interest-${paramValue}`);
        if (checkbox) {
          checkbox.checked = true;
        }
        
        // Wenn Texte für diesen Parameter-Wert definiert sind
        if (formTexts[paramValue]) {
          // Alle Headings mit data-change-headline Attribut finden und ändern
          const headingsWithDataAttr = document.querySelectorAll('[data-change-headline]');
          headingsWithDataAttr.forEach(heading => {
            heading.innerHTML = formTexts[paramValue].heading;
          });
          
          // Alle Texte mit data-change-text Attribut finden und ändern
          const textsWithDataAttr = document.querySelectorAll('[data-change-text]');
          textsWithDataAttr.forEach(text => {
            text.innerHTML = formTexts[paramValue].text;
          });
          
          // AI Toolkit Checkbox ein- oder ausblenden basierend auf selectToolkitInput
          if (toolkitCheckboxContainer && formTexts[paramValue].hasOwnProperty('selectToolkitInput')) {
            if (formTexts[paramValue].selectToolkitInput === true) {
              toolkitCheckboxContainer.style.display = '';
            } else {
              toolkitCheckboxContainer.style.display = 'none';
            }
          }
        }
      } 
      // Für alle anderen Parameter: Wert in entsprechendes Formularfeld eintragen
      else if (fieldName) {
        // Versuche zuerst, das Element über name zu finden
        let field = document.querySelector(`[name="${fieldName}"]`);
        
        // Falls nicht gefunden, versuche über id
        if (!field) {
          field = document.getElementById(fieldName);
        }
        
        // Wenn das Feld gefunden wurde, setze den Wert
        if (field) {
          field.value = decodeURIComponent(paramValue);
        }
      }
    }
  }
});

