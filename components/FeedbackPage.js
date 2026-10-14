/* Feedback shares the structural wireframe renderer. */
window.FeedbackPage={
 mount(wb){
  const page=MoreFeaturePages.mount(wb,'feedback');
  page.classList.add('feedback-page');
  wb.classList.add('has-feedback-page');
  return page;
 }
};
