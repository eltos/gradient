import QtQuick 2.15

Rectangle {

    gradient: Gradient {
        /* test comment */
        orientation: Gradient.Horizontal
        GradientStop { position: 0.000; color: "#123456" }
        GradientStop { position: 1.000; color: "#ABCDEF" }
    }

}
