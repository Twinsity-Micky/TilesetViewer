import MainView from "./app/gui/MainView";

let mainView: MainView;

window.onload = () => {
  mainView = new MainView();
};

window.onunload = () => {
  mainView?.dispose();
}
