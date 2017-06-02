define(['knockout'], function(ko) {

    function NiftyListViewModel(params) {
        this.componentText = params.componentText;
    }
    console.debug('component loaded');

    return NiftyListViewModel;
});