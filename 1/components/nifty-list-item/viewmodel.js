define(['knockout'], function(ko) {

    function NiftyListItemViewModel(params) {
        this.labelText = params.labelText;
    }
    console.debug('component loaded');

    return NiftyListItemViewModel;
});