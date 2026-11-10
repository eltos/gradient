#!/usr/bin/env python

from matplotlib.colors import LinearSegmentedColormap

my_gradient = LinearSegmentedColormap.from_list('my gradient', (
    # test comment
    (0.000, (0.071, 0.204, 0.337)),
    (1.000, (0.671, 0.804, 0.937))))


if __name__ == '__main__':
    import numpy as np
    from matplotlib import pyplot as plt
    
    plt.imshow([np.arange(1000)], aspect="auto", cmap=my_gradient)
    plt.show()
