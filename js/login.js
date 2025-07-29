window.addEventListener("DOMContentLoaded", () => {
    const toggleIcon = document.querySelector('.toggle-password');
    if (!toggleIcon) return;

    toggleIcon.addEventListener('click', function () {
        const input = this.previousElementSibling;
        input.type = input.type === 'password' ? 'text' : 'password';
        this.innerHTML = `<i class="far fa-eye${input.type === 'password' ? '' : '-slash'}"></i>`;
    });
});
